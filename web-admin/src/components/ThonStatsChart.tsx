import type { HoSoViPham, Thon, TrangThaiHoSo } from "../types";

const COLORS: Record<TrangThaiHoSo, string> = {
  moi_phat_hien: "var(--color-danger)",
  da_ra_quyet_dinh: "var(--color-warn)",
  da_giai_quyet_dut_diem: "var(--color-success)",
};

const LABELS: Record<TrangThaiHoSo, string> = {
  moi_phat_hien: "Mới phát hiện",
  da_ra_quyet_dinh: "Đã ra Quyết định",
  da_giai_quyet_dut_diem: "Đã giải quyết dứt điểm",
};

const ORDER: TrangThaiHoSo[] = ["moi_phat_hien", "da_ra_quyet_dinh", "da_giai_quyet_dut_diem"];

interface ThonStat {
  thon: Thon;
  total: number;
  counts: Record<TrangThaiHoSo, number>;
}

export function ThonStatsChart({ hoSoList, thonList }: { hoSoList: HoSoViPham[]; thonList: Thon[] }) {
  const stats: ThonStat[] = thonList
    .map((thon) => {
      const counts: Record<TrangThaiHoSo, number> = {
        moi_phat_hien: 0,
        da_ra_quyet_dinh: 0,
        da_giai_quyet_dut_diem: 0,
      };
      hoSoList.forEach((h) => {
        if (h.thon_id === thon.id) counts[h.trang_thai_xu_ly]++;
      });
      const total = counts.moi_phat_hien + counts.da_ra_quyet_dinh + counts.da_giai_quyet_dut_diem;
      return { thon, total, counts };
    })
    .filter((s) => s.total > 0)
    .sort((a, b) => b.total - a.total);

  if (stats.length === 0) {
    return (
      <div className="text-muted" style={{ padding: "32px 0", textAlign: "center" }}>
        Chưa có dữ liệu vụ việc để thống kê.
      </div>
    );
  }

  const maxTotal = stats[0].total;

  return (
    <div>
      <div className="thon-chart">
        {stats.map(({ thon, total, counts }) => (
          <div key={thon.id} className="thon-chart-row">
            <div className="thon-chart-label">
              <span>{thon.ten_thon}</span>
              <span className="thon-chart-total">{total} vụ</span>
            </div>
            <div className="thon-chart-track">
              <div className="thon-chart-bar" style={{ width: `${Math.max((total / maxTotal) * 100, 6)}%` }}>
                {ORDER.map((key) =>
                  counts[key] > 0 ? (
                    <div
                      key={key}
                      className="thon-chart-segment"
                      style={{ flex: counts[key], background: COLORS[key] }}
                      title={`${LABELS[key]}: ${counts[key]}`}
                    />
                  ) : null
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="legend-row" style={{ marginTop: 20 }}>
        {ORDER.map((key) => (
          <span key={key} className="legend-item">
            <span className="legend-dot" style={{ background: COLORS[key] }} />
            {LABELS[key]}
          </span>
        ))}
      </div>
    </div>
  );
}
