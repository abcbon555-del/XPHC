import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { listHoSoBanDo } from "../api/hoSo";
import { listThon } from "../api/thon";
import type { Thon, TrangThaiHoSo } from "../types";
import { MapView } from "../components/MapView";
import { ThonStatsChart } from "../components/ThonStatsChart";
import { TimKiemXa } from "../components/TimKiemXa";
import { Layout } from "../components/Layout";

const TRANG_THAI_LABEL: Record<TrangThaiHoSo, string> = {
  moi_phat_hien: "Đỏ - Mới phát hiện",
  da_ra_quyet_dinh: "Vàng - Đã ra Quyết định, chưa nộp phạt/khắc phục",
  da_giai_quyet_dut_diem: "Xanh - Đã giải quyết dứt điểm",
};

const BADGE_CLASS: Record<TrangThaiHoSo, string> = {
  moi_phat_hien: "badge-red",
  da_ra_quyet_dinh: "badge-yellow",
  da_giai_quyet_dut_diem: "badge-green",
};

export function DashboardMapPage() {
  const [thonId, setThonId] = useState<string>("");
  const [trangThai, setTrangThai] = useState<TrangThaiHoSo | "">("");
  const [viTriBanDo, setViTriBanDo] = useState<{ lat: number; lng: number } | null>(null);

  const { data: thonList = [] } = useQuery({ queryKey: ["thon"], queryFn: listThon });
  const { data: hoSoList = [], isLoading } = useQuery({
    queryKey: ["ho-so-ban-do", thonId, trangThai],
    queryFn: () =>
      listHoSoBanDo({
        thon_id: thonId || undefined,
        trang_thai_xu_ly: (trangThai as TrangThaiHoSo) || undefined,
      }),
  });
  // Danh sách đầy đủ, không lọc - dùng riêng cho biểu đồ thống kê theo Thôn
  // để bộ lọc bản đồ không làm sai lệch biểu đồ tổng quan.
  const { data: allHoSoList = [] } = useQuery({ queryKey: ["ho-so-ban-do", "all"], queryFn: () => listHoSoBanDo() });

  const thonMap = useMemo(() => {
    const map: Record<string, Thon> = {};
    thonList.forEach((t) => (map[t.id] = t));
    return map;
  }, [thonList]);

  const counts = useMemo(() => {
    const c: Record<TrangThaiHoSo, number> = { moi_phat_hien: 0, da_ra_quyet_dinh: 0, da_giai_quyet_dut_diem: 0 };
    hoSoList.forEach((h) => c[h.trang_thai_xu_ly]++);
    return c;
  }, [hoSoList]);

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Bản đồ số vi phạm</h1>
        <p className="page-subtitle">Toàn bộ vụ việc vi phạm hành chính trên địa bàn, cập nhật theo thời gian thực.</p>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card-value">{hoSoList.length}</div>
          <div className="stat-card-label">Tổng số vụ</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value" style={{ color: "var(--color-danger)" }}>
            {counts.moi_phat_hien}
          </div>
          <div className="stat-card-label">Mới phát hiện</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value" style={{ color: "var(--color-warn)" }}>
            {counts.da_ra_quyet_dinh}
          </div>
          <div className="stat-card-label">Đã ra Quyết định</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value" style={{ color: "var(--color-success)" }}>
            {counts.da_giai_quyet_dut_diem}
          </div>
          <div className="stat-card-label">Đã giải quyết dứt điểm</div>
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <TimKiemXa onChon={(d) => setViTriBanDo({ lat: d.lat, lng: d.lng })} />
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <select className="input" style={{ width: 200 }} value={thonId} onChange={(e) => setThonId(e.target.value)}>
              <option value="">Tất cả Thôn</option>
              {thonList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.ten_thon}
                </option>
              ))}
            </select>
            <select
              className="input"
              style={{ width: 280 }}
              value={trangThai}
              onChange={(e) => setTrangThai(e.target.value as TrangThaiHoSo | "")}
            >
              <option value="">Tất cả trạng thái</option>
              {Object.entries(TRANG_THAI_LABEL).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            {isLoading && <span className="text-muted">Đang tải...</span>}
          </div>
        </div>
      </div>

      <div className="dashboard-split">
        <div className="card" style={{ height: "62vh", overflow: "hidden" }}>
          <MapView hoSoList={hoSoList} thonMap={thonMap} flyTo={viTriBanDo} />
        </div>

        <div className="card card-pad" style={{ height: "62vh", overflow: "auto" }}>
          <div className="chart-header">
            <h3>Vụ việc theo Thôn</h3>
            <p>Sắp xếp theo tổng số vụ việc, giảm dần</p>
          </div>
          <ThonStatsChart hoSoList={allHoSoList} thonList={thonList} />
        </div>
      </div>

      <div className="legend-row">
        {Object.entries(TRANG_THAI_LABEL).map(([key, label]) => (
          <span key={key} className={`badge ${BADGE_CLASS[key as TrangThaiHoSo]}`}>
            {label}
          </span>
        ))}
      </div>
    </Layout>
  );
}
