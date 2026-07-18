import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Printer, Trash2, X } from "lucide-react";
import { deleteHoSo, getHoSo, listHoSoFiles, updateHoSo } from "../api/hoSo";
import { listThon } from "../api/thon";
import { listLinhVuc, listHanhVi } from "../api/danhMuc";
import { getDoiTuong } from "../api/doiTuong";
import { useAuth } from "../context/AuthContext";
import { useConfig } from "../context/ConfigContext";
import type { DanhMucFile, TrangThaiHoSo } from "../types";
import { Layout } from "../components/Layout";
import { FileCategoryUpload } from "../components/FileCategoryUpload";
import { SecureImage } from "../components/SecureImage";
import { LocationPicker } from "../components/LocationPicker";
import { extractErrorMessage } from "../utils/errors";

const HANH_VI_KHAC = "__khac__";

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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const config = useConfig();
  const [xemTruocKhiIn, setXemTruocKhiIn] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    thon_id: "",
    linh_vuc_id: "",
    hanh_vi_id: "",
    hanh_vi_mo_ta_them: "",
    dia_chi_map: "",
    lat: 0,
    lng: 0,
    so_tien_phat: "",
  });

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

  const updateMutation = useMutation({
    mutationFn: (trang_thai_xu_ly: TrangThaiHoSo) => updateHoSo(id!, { trang_thai_xu_ly }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ho-so-detail", id] }),
  });

  const editMutation = useMutation({
    mutationFn: () =>
      updateHoSo(id!, {
        thon_id: editForm.thon_id,
        linh_vuc_id: editForm.linh_vuc_id,
        hanh_vi_id: editForm.hanh_vi_id === HANH_VI_KHAC ? null : editForm.hanh_vi_id,
        hanh_vi_mo_ta_them: editForm.hanh_vi_mo_ta_them || undefined,
        dia_chi_map: editForm.dia_chi_map || undefined,
        vi_do: editForm.lat,
        kinh_do: editForm.lng,
        so_tien_phat: editForm.so_tien_phat ? Number(editForm.so_tien_phat) : 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ho-so-detail", id] });
      setEditMode(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteHoSo(id!),
    onSuccess: () => navigate("/ho-so"),
  });

  const hanhViTheoLinhVucEdit = useMemo(
    () => hanhViList.filter((h) => h.linh_vuc_id === editForm.linh_vuc_id),
    [hanhViList, editForm.linh_vuc_id]
  );

  function startEdit() {
    if (!hoSo) return;
    setEditForm({
      thon_id: hoSo.thon_id,
      linh_vuc_id: hoSo.linh_vuc_id,
      hanh_vi_id: hoSo.hanh_vi_id ?? HANH_VI_KHAC,
      hanh_vi_mo_ta_them: hoSo.hanh_vi_mo_ta_them ?? "",
      dia_chi_map: hoSo.dia_chi_map ?? "",
      lat: hoSo.vi_do,
      lng: hoSo.kinh_do,
      so_tien_phat: String(hoSo.so_tien_phat),
    });
    setEditMode(true);
  }

  function handleDeleteHoSo() {
    if (!hoSo) return;
    if (window.confirm(`Xóa vĩnh viễn hồ sơ "${hoSo.so_bien_ban}"? Toàn bộ tệp đính kèm sẽ bị xóa theo. Không thể hoàn tác.`)) {
      deleteMutation.mutate();
    }
  }

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
  const coQuanVietTat = config.ten_co_quan_chu_quan.toUpperCase().replace("ỦY BAN NHÂN DÂN", "UBND");

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
          <div style={{ display: "flex", gap: 8 }}>
            {user?.is_admin && !editMode && (
              <>
                <button className="btn btn-secondary" onClick={startEdit}>
                  <Pencil size={15} /> Sửa hồ sơ
                </button>
                <button className="btn btn-secondary" onClick={handleDeleteHoSo} disabled={deleteMutation.isPending}>
                  <Trash2 size={15} /> Xóa hồ sơ
                </button>
              </>
            )}
            <button className="btn btn-secondary" onClick={() => setXemTruocKhiIn(true)}>
              <Printer size={15} /> In hồ sơ
            </button>
          </div>
        </div>

        {deleteMutation.isError && (
          <div className="error-banner" style={{ marginBottom: 16, maxWidth: 640 }}>
            {extractErrorMessage(deleteMutation.error)}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 20, marginBottom: 28, maxWidth: 640 }}>
          {editMode ? (
            <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <h3 style={{ fontSize: 14 }}>Sửa hồ sơ vi phạm</h3>
              <div className="field">
                <label className="label">Thôn</label>
                <select
                  className="input"
                  value={editForm.thon_id}
                  onChange={(e) => setEditForm({ ...editForm, thon_id: e.target.value })}
                >
                  {thonList.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.ten_thon}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="label">Lĩnh vực vi phạm hành chính</label>
                <select
                  className="input"
                  value={editForm.linh_vuc_id}
                  onChange={(e) => setEditForm({ ...editForm, linh_vuc_id: e.target.value, hanh_vi_id: HANH_VI_KHAC })}
                >
                  {linhVucList.map((lv) => (
                    <option key={lv.id} value={lv.id}>
                      {lv.ten_linh_vuc}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="label">Hành vi vi phạm</label>
                <select
                  className="input"
                  value={editForm.hanh_vi_id}
                  onChange={(e) => setEditForm({ ...editForm, hanh_vi_id: e.target.value })}
                >
                  <option value="">-- Chọn Hành vi --</option>
                  {hanhViTheoLinhVucEdit.map((hv) => (
                    <option key={hv.id} value={hv.id}>
                      {hv.ten_hanh_vi}
                    </option>
                  ))}
                  <option value={HANH_VI_KHAC}>Khác (tự ghi thông tin bên dưới)</option>
                </select>
              </div>
              <div className="field">
                <label className="label">Mô tả rõ hành vi vi phạm</label>
                <textarea
                  className="input"
                  rows={3}
                  value={editForm.hanh_vi_mo_ta_them}
                  onChange={(e) => setEditForm({ ...editForm, hanh_vi_mo_ta_them: e.target.value })}
                />
              </div>
              <div className="field">
                <label className="label">Số tiền phạt (VNĐ)</label>
                <input
                  className="input"
                  type="number"
                  min={0}
                  value={editForm.so_tien_phat}
                  onChange={(e) => setEditForm({ ...editForm, so_tien_phat: e.target.value })}
                />
              </div>
              <div className="field">
                <label className="label">Vị trí vi phạm</label>
                <LocationPicker
                  lat={editForm.lat}
                  lng={editForm.lng}
                  onChange={(lat, lng) => setEditForm({ ...editForm, lat, lng })}
                />
              </div>
              <div className="field">
                <label className="label">Địa chỉ (theo bản đồ)</label>
                <input
                  className="input"
                  value={editForm.dia_chi_map}
                  onChange={(e) => setEditForm({ ...editForm, dia_chi_map: e.target.value })}
                />
              </div>
              {editMutation.isError && (
                <div className="error-banner" style={{ marginBottom: 0 }}>
                  {extractErrorMessage(editMutation.error)}
                </div>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-primary" disabled={editMutation.isPending} onClick={() => editMutation.mutate()}>
                  {editMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
                <button className="btn btn-secondary" onClick={() => setEditMode(false)}>
                  Hủy
                </button>
              </div>
            </div>
          ) : (
            <div className="card card-pad">
              <InfoRow label="Thôn" value={thonTen} />
              <InfoRow label="Lĩnh vực vi phạm" value={linhVucTen} />
              <InfoRow label="Hành vi vi phạm" value={hanhViTen} />
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
          )}
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
        <div className="print-letterhead">
          <div className="print-letterhead-col">
            <div className="print-letterhead-agency">{coQuanVietTat}</div>
            <div className="print-letterhead-unit">TỔ KIỂM TRA</div>
          </div>
          <div className="print-letterhead-col">
            <div className="print-letterhead-quochieu">Cộng hòa xã hội chủ nghĩa Việt Nam</div>
            <div className="print-letterhead-tieungu">Độc lập - Tự do - Hạnh phúc</div>
          </div>
        </div>
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <h1 style={{ fontSize: 20, margin: "16px 0 4px", textTransform: "uppercase" }}>
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
            <tr><td>Người lập biên bản</td><td>{hoSo.nguoi_lap_ho_ten}</td></tr>
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
                      <SecureImage path={f.duong_dan} alt={f.ten_file_goc} />
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

        <div className="print-footer-note">
          Biên bản được thiết lập trên môi trường điện tử, thông tin vi phạm và hình ảnh của hành vi vi phạm được
          dùng làm căn cứ giải quyết.
        </div>
        </div>
      </div>
    </Layout>
  );
}
