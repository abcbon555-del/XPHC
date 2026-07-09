import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, FilePlus2, Trash2 } from "lucide-react";
import { deleteHoSo, listHoSo } from "../api/hoSo";
import { listThon } from "../api/thon";
import type { TrangThaiHoSo } from "../types";
import { Layout } from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { extractErrorMessage } from "../utils/errors";

const TRANG_THAI_LABEL: Record<TrangThaiHoSo, string> = {
  moi_phat_hien: "Mới phát hiện",
  da_ra_quyet_dinh: "Đã ra Quyết định",
  da_giai_quyet_dut_diem: "Đã giải quyết dứt điểm",
};

const BADGE_CLASS: Record<TrangThaiHoSo, string> = {
  moi_phat_hien: "badge-red",
  da_ra_quyet_dinh: "badge-yellow",
  da_giai_quyet_dut_diem: "badge-green",
};

export function HoSoListPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [thonId, setThonId] = useState("");
  const [tuNgay, setTuNgay] = useState("");
  const [denNgay, setDenNgay] = useState("");

  const { data: thonList = [] } = useQuery({ queryKey: ["thon"], queryFn: listThon });
  const { data: hoSoList = [], isLoading } = useQuery({
    queryKey: ["ho-so-list", thonId, tuNgay, denNgay],
    queryFn: () =>
      listHoSo({
        thon_id: thonId || undefined,
        tu_ngay: tuNgay || undefined,
        den_ngay: denNgay || undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteHoSo(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ho-so-list"] }),
  });

  function handleDelete(id: string, soBienBan: string) {
    if (window.confirm(`Xóa vĩnh viễn hồ sơ "${soBienBan}"? Toàn bộ tệp đính kèm sẽ bị xóa theo. Không thể hoàn tác.`)) {
      deleteMutation.mutate(id);
    }
  }

  const thonMap = useMemo(() => Object.fromEntries(thonList.map((t) => [t.id, t.ten_thon])), [thonList]);

  return (
    <Layout>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
        <div>
          <h1 className="page-title">Danh sách hồ sơ vi phạm</h1>
          <p className="page-subtitle">Tra cứu, lọc theo thôn và khoảng thời gian lập biên bản.</p>
        </div>
        {(user?.is_admin || user?.quyen_nhap_lieu) && (
          <Link to="/ho-so/moi" className="btn btn-primary" style={{ whiteSpace: "nowrap" }}>
            <FilePlus2 size={15} /> Lập biên bản mới
          </Link>
        )}
      </div>

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <select className="input" style={{ width: 200 }} value={thonId} onChange={(e) => setThonId(e.target.value)}>
            <option value="">Tất cả Thôn</option>
            {thonList.map((t) => (
              <option key={t.id} value={t.id}>
                {t.ten_thon}
              </option>
            ))}
          </select>
          <div className="field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <label className="label" style={{ whiteSpace: "nowrap" }}>
              Từ ngày
            </label>
            <input type="date" className="input" value={tuNgay} onChange={(e) => setTuNgay(e.target.value)} />
          </div>
          <div className="field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <label className="label" style={{ whiteSpace: "nowrap" }}>
              Đến ngày
            </label>
            <input type="date" className="input" value={denNgay} onChange={(e) => setDenNgay(e.target.value)} />
          </div>
          {isLoading && <span className="text-muted">Đang tải...</span>}
        </div>
      </div>

      {deleteMutation.isError && (
        <div className="error-banner" style={{ marginBottom: 12 }}>
          {extractErrorMessage(deleteMutation.error)}
        </div>
      )}

      <div className="card table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Số biên bản</th>
              <th>Thôn</th>
              <th>Ngày lập</th>
              <th>Trạng thái</th>
              <th>Số tiền phạt</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {hoSoList.map((hoSo) => (
              <tr key={hoSo.id}>
                <td style={{ fontWeight: 600 }}>{hoSo.so_bien_ban}</td>
                <td>{thonMap[hoSo.thon_id]}</td>
                <td>{new Date(hoSo.ngay_lap).toLocaleDateString("vi-VN")}</td>
                <td>
                  <span className={`badge ${BADGE_CLASS[hoSo.trang_thai_xu_ly]}`}>
                    {TRANG_THAI_LABEL[hoSo.trang_thai_xu_ly]}
                  </span>
                </td>
                <td>{hoSo.so_tien_phat.toLocaleString("vi-VN")} VNĐ</td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <Link
                      to={`/ho-so/${hoSo.id}`}
                      style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--color-accent)", fontWeight: 600, fontSize: 13 }}
                    >
                      Xem hồ sơ <ArrowRight size={14} />
                    </Link>
                    {user?.is_admin && (
                      <button
                        onClick={() => handleDelete(hoSo.id, hoSo.so_bien_ban)}
                        disabled={deleteMutation.isPending}
                        title="Xóa hồ sơ"
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-danger)", padding: 2, display: "flex" }}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {hoSoList.length === 0 && !isLoading && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 32, color: "var(--color-text-muted)" }}>
                  Không có hồ sơ nào khớp bộ lọc
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
