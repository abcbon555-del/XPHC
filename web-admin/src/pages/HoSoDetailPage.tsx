import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Printer, X } from "lucide-react";
import { getHoSo, listHoSoFiles, updateHoSo } from "../api/hoSo";
import { listThon } from "../api/thon";
import { listLinhVuc, listHanhVi } from "../api/danhMuc";
import { getDoiTuong } from "../api/doiTuong";
import { listNguoiDung } from "../api/nguoiDung";
import { resolveFileUrl } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useConfig } from "../context/ConfigContext";
import type { DanhMucFile, TrangThaiHoSo } from "../types";
import { Layout } from "../components/Layout";
import { FileCategoryUpload } from "../components/FileCategoryUpload";
import { extractErrorMessage } from "../utils/errors";

const TRANG_THAI_LABEL: Record<TrangThaiHoSo, string> = {
  moi_phat_hien: "Mới phát hiện",
  da_ra_quyet_dinh: "Đã ra Quyết định, chưa nộp phạt/khắc phục",
  da_giai_quyet_dut_diem: "Đã giải quyết dứt điểm",
};

const DANH_MUC_LABEL: Record<DanhMucFile, string> = {
  bien_ban_va_anh: "Biên bản ban đầu + Ảnh bằng chứng",
  quyet_dinh_xu_phat: "Quyết định xử phạt",
  bien_lai_khac_phuc: "Biên lai nộp tiền + Ảnh khắc phục hậu quả",
};

const TRANG_THAI_OPTIONS: { value: TrangThaiHoSo; label: string }[] = [
  { value: "moi_phat_hien", label: "Đỏ - Mới phát hiện" },
  { value: "da_ra_quyet_dinh", label: "Vàng - Đã ra Quyết định" },
  { value: "da_giai_quyet_dut_diem", label: "Xanh - Đã giải quyết dứt điểm" },
];

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "10px 0", borderBottom: "1px solid var(--color-border)" }}>
      <span className="text-muted" style={{ fontSize: 13.5 }}>
        {label}
      </span>
      <span style={{ fontSize: 13.5, fontWeight: 600, textAlign: "right" }}>{value}</span>
    </div>
  );
}

export function HoSoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const config = useConfig();
  const [xemTruocKhiIn, setXemTruocKhiIn] = useState(false);

  const { data: hoSo, isLoading } = useQuery({
    queryKey: ["ho-so-detail", id],
    queryFn: () => getHoSo(id!),
    enabled: !!id,
  });
  const { data: thonList = [] } = useQuery({ queryKey: ["thon"], queryFn: listThon });
  const { data: linhVucList = [] } = useQuery({ queryKey: ["linh-vuc"], queryFn: listLinhVuc });
  const { data: hanhViList = [] } = useQuery({ queryKey: ["hanh-vi"], queryFn: listHanhVi });
  const { data: files = [] } = useQuery({
    queryKey: ["ho-so-files", id],
    queryFn: () => listHoSoFiles(id!),
    enabled: !!id,
  });
  const { data: doiTuong } = useQuery({
    queryKey: ["doi-tuong", hoSo?.doi_tuong_id],
    queryFn: () => getDoiTuong(hoSo!.doi_tuong_id),
    enabled: !!hoSo,
  });
  const { data: allUsers = [] } = useQuery({
    queryKey: ["nguoi-dung"],
    queryFn: listNguoiDung,
    enabled: !!user?.is_admin,
  });

  const updateMutation = useMutation({
    mutationFn: (trang_thai_xu_ly: TrangThaiHoSo) => updateHoSo(id!, { trang_thai_xu_ly }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ho-so-detail", id] }),
  });

  if (isLoading || !hoSo) {
    return (
      <Layout>
        <div className="text-muted">Đang tải...</div>
      </Layout>
    );
  }

  const thonTen = thonList.find((t) => t.id === hoSo.thon_id)?.ten_thon ?? "";
  const linhVucTen = linhVucList.find((l) => l.id === hoSo.linh_vuc_id)?.ten_linh_vuc ?? "";
  const hanhViTen = hoSo.hanh_vi_id
    ? hanhViList.find((h) => h.id === hoSo.hanh_vi_id)?.ten_hanh_vi ?? ""
    : "Khác (xem mô tả chi tiết)";
  const nguoiLapTen = user?.is_admin
    ? allUsers.find((u) => u.id === hoSo.nguoi_lap_id)?.ho_ten ?? "—"
    : hoSo.nguoi_lap_id === user?.id
      ? user.ho_ten
      : "—";

  return (
    <Layout>
      <div className="no-print">
        <Link
          to="/ho-so"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--color-text-muted)", fontSize: 13.5, marginBottom: 12 }}
        >
          <ArrowLeft size={15} /> Quay lại danh sách hồ sơ
        </Link>

        <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 className="page-title">Hồ sơ vi phạm: {hoSo.so_bien_ban}</h1>
            <p className="page-subtitle">Chi tiết hồ sơ, cập nhật trạng thái xử lý và quản lý tài liệu đính kèm.</p>
          </div>
          <button className="btn btn-secondary" onClick={() => setXemTruocKhiIn(true)}>
            <Printer size={15} /> In hồ sơ
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 20, marginBottom: 28, maxWidth: 640 }}>
          <div className="card card-pad">
            <InfoRow label="Thôn" value={thonTen} />
            <InfoRow label="Ngày lập" value={new Date(hoSo.ngay_lap).toLocaleString("vi-VN")} />
            <InfoRow label="Địa chỉ (theo bản đồ)" value={hoSo.dia_chi_map ?? "(chưa có)"} />
            <InfoRow label="Tọa độ" value={`${hoSo.vi_do}, ${hoSo.kinh_do}`} />
            <InfoRow label="Số tiền phạt" value={`${hoSo.so_tien_phat.toLocaleString("vi-VN")} VNĐ`} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14 }}>
              <span className="label">Trạng thái xử lý</span>
              <select
                className="input"
                style={{ width: 260 }}
                value={hoSo.trang_thai_xu_ly}
                onChange={(e) => updateMutation.mutate(e.target.value as TrangThaiHoSo)}
                disabled={updateMutation.isPending}
              >
                {TRANG_THAI_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {updateMutation.isError && (
              <div className="error-banner" style={{ marginTop: 14, marginBottom: 0 }}>
                {extractErrorMessage(updateMutation.error)}
              </div>
            )}
          </div>
        </div>

        <h2 style={{ fontSize: 17, marginBottom: 14 }}>Hồ sơ điện tử</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          <FileCategoryUpload hoSoId={hoSo.id} danhMuc="bien_ban_va_anh" title="(1) Biên bản ban đầu + Ảnh bằng chứng" />
          <FileCategoryUpload
            hoSoId={hoSo.id}
            danhMuc="quyet_dinh_xu_phat"
            title="(2) Quyết định xử phạt (File PDF có dấu đỏ/ký số)"
          />
          <FileCategoryUpload
            hoSoId={hoSo.id}
            danhMuc="bien_lai_khac_phuc"
            title="(3) Biên lai nộp tiền + Ảnh khắc phục hậu quả"
          />
        </div>
      </div>

      <div
        className={`print-report${xemTruocKhiIn ? " print-preview-open" : ""}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) setXemTruocKhiIn(false);
        }}
      >
        <div className="print-preview-toolbar no-print">
          <div style={{ fontWeight: 600, fontSize: 13.5 }}>Xem trước khi in</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
              <Printer size={14} /> In ngay
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setXemTruocKhiIn(false)}>
              <X size={14} /> Đóng
            </button>
          </div>
        </div>
        <div className="print-report-page">
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div style={{ fontWeight: 700, textTransform: "uppercase" }}>Cộng hòa xã hội chủ nghĩa Việt Nam</div>
          <div style={{ fontWeight: 700 }}>Độc lập - Tự do - Hạnh phúc</div>
          <div style={{ margin: "4px 0 12px" }}>─────────────</div>
          <div className="text-muted" style={{ fontSize: 13 }}>{config.ten_co_quan_chu_quan}</div>
          <h1 style={{ fontSize: 20, margin: "10px 0 4px", textTransform: "uppercase" }}>
            Biên bản kiểm tra hiện trạng vi phạm hành chính
          </h1>
          <div style={{ fontSize: 13.5 }}>Số: {hoSo.so_bien_ban}</div>
        </div>

        <h3 className="print-section-title">I. Thông tin chung</h3>
        <table className="print-info-table">
          <tbody>
            <tr><td>Thôn</td><td>{thonTen}</td></tr>
            <tr><td>Ngày lập biên bản</td><td>{new Date(hoSo.ngay_lap).toLocaleString("vi-VN")}</td></tr>
            <tr><td>Lĩnh vực vi phạm</td><td>{linhVucTen}</td></tr>
            <tr><td>Hành vi vi phạm</td><td>{hanhViTen}</td></tr>
            {hoSo.hanh_vi_mo_ta_them && <tr><td>Mô tả chi tiết</td><td>{hoSo.hanh_vi_mo_ta_them}</td></tr>}
            <tr><td>Địa chỉ (theo bản đồ)</td><td>{hoSo.dia_chi_map ?? "(chưa có)"}</td></tr>
            <tr><td>Tọa độ</td><td>{hoSo.vi_do}, {hoSo.kinh_do}</td></tr>
            <tr><td>Trạng thái xử lý</td><td>{TRANG_THAI_LABEL[hoSo.trang_thai_xu_ly]}</td></tr>
            <tr><td>Số tiền phạt</td><td>{hoSo.so_tien_phat.toLocaleString("vi-VN")} VNĐ</td></tr>
            <tr><td>Người lập biên bản</td><td>{nguoiLapTen}</td></tr>
          </tbody>
        </table>

        <h3 className="print-section-title">II. Đối tượng vi phạm</h3>
        <table className="print-info-table">
          <tbody>
            <tr><td>Họ và tên</td><td>{doiTuong?.ho_ten ?? "Đang tải..."}</td></tr>
            <tr><td>Số CCCD</td><td>{doiTuong?.so_cccd || "(chưa có)"}</td></tr>
            <tr><td>Số điện thoại</td><td>{doiTuong?.so_dt || "(chưa có)"}</td></tr>
            <tr><td>Địa chỉ</td><td>{doiTuong?.dia_chi || "(chưa có)"}</td></tr>
            <tr><td>Số lần tái phạm</td><td>{doiTuong?.so_lan_tai_pham ?? 0}</td></tr>
          </tbody>
        </table>

        {(["bien_ban_va_anh", "quyet_dinh_xu_phat", "bien_lai_khac_phuc"] as DanhMucFile[]).map((danhMuc, idx) => {
          const nhomFiles = files.filter((f) => f.danh_muc === danhMuc);
          if (nhomFiles.length === 0) return null;
          const anh = nhomFiles.filter((f) => f.loai_file?.startsWith("image/"));
          const khac = nhomFiles.filter((f) => !f.loai_file?.startsWith("image/"));
          return (
            <div key={danhMuc} style={{ breakInside: "avoid" }}>
              <h3 className="print-section-title">
                {["III", "IV", "V"][idx]}. {DANH_MUC_LABEL[danhMuc]}
              </h3>
              {anh.length > 0 && (
                <div className="print-photo-grid">
                  {anh.map((f) => (
                    <div key={f.id} className="print-photo-item">
                      <img src={resolveFileUrl(f.duong_dan)} alt={f.ten_file_goc} />
                      <div className="print-photo-caption">{f.ten_file_goc}</div>
                    </div>
                  ))}
                </div>
              )}
              {khac.length > 0 && (
                <ul style={{ fontSize: 12.5, margin: "6px 0 16px", paddingLeft: 18 }}>
                  {khac.map((f) => (
                    <li key={f.id}>{f.ten_file_goc}</li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}

        <div className="print-signature-row">
          <div className="print-signature-block">
            <div style={{ fontWeight: 700 }}>Đối tượng vi phạm</div>
            <div className="text-muted" style={{ fontSize: 12 }}>(Ký, ghi rõ họ tên)</div>
          </div>
          <div className="print-signature-block">
            <div style={{ fontWeight: 700 }}>Người lập biên bản</div>
            <div className="text-muted" style={{ fontSize: 12 }}>(Ký, ghi rõ họ tên)</div>
          </div>
        </div>
        </div>
      </div>
    </Layout>
  );
}
