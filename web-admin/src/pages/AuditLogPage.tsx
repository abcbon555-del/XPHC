import { useQuery } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";
import { listAuditLog } from "../api/auditLog";
import { Layout } from "../components/Layout";

const METHOD_BADGE: Record<string, string> = {
  GET: "badge-gray",
  POST: "badge-green",
  PUT: "badge-yellow",
  PATCH: "badge-yellow",
  DELETE: "badge-red",
};

export function AuditLogPage() {
  const { data: logs = [], isLoading } = useQuery({ queryKey: ["audit-log"], queryFn: () => listAuditLog() });

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Nhật ký hệ thống</h1>
        <p className="page-subtitle">
          Bảng này chỉ ghi thêm (không thể sửa/xóa) — không ai được sửa hoặc xóa, kể cả Quản trị viên. Được bảo vệ ở
          tầng cơ sở dữ liệu.
        </p>
      </div>

      <div
        className="card card-pad"
        style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 10, color: "var(--color-text-muted)", fontSize: 13 }}
      >
        <ShieldAlert size={16} />
        Dữ liệu trên trang này chỉ để đối chiếu — không thể chỉnh sửa hoặc xóa từ bất kỳ giao diện nào, kể cả API.
      </div>

      <div className="card table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Tài khoản</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => {
              const method = log.hanh_dong.split(" ")[0];
              return (
                <tr key={log.id}>
                  <td className="text-muted" style={{ whiteSpace: "nowrap" }}>
                    {new Date(log.thoi_gian).toLocaleString("vi-VN")}
                  </td>
                  <td style={{ fontFamily: "monospace", fontSize: 12.5 }}>{log.tai_khoan_id ?? "(không xác định)"}</td>
                  <td>
                    <span className={`badge ${METHOD_BADGE[method] ?? "badge-gray"}`} style={{ marginRight: 8 }}>
                      {method}
                    </span>
                    <span style={{ fontFamily: "monospace", fontSize: 12.5 }}>
                      {log.hanh_dong.slice(method.length).trim()}
                    </span>
                  </td>
                </tr>
              );
            })}
            {logs.length === 0 && !isLoading && (
              <tr>
                <td colSpan={3} style={{ textAlign: "center", padding: 32, color: "var(--color-text-muted)" }}>
                  Chưa có nhật ký nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
