import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { createThon, deactivateThon, listThon, updateThon } from "../api/thon";
import { Layout } from "../components/Layout";
import { extractErrorMessage } from "../utils/errors";

export function ThonManagementPage() {
  const queryClient = useQueryClient();
  const { data: thonList = [], isLoading } = useQuery({ queryKey: ["thon"], queryFn: listThon });

  const [tenThon, setTenThon] = useState("");
  const [maThon, setMaThon] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [dangSuaId, setDangSuaId] = useState<string | null>(null);
  const [tenDangSua, setTenDangSua] = useState("");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["thon"] });

  const createMutation = useMutation({
    mutationFn: () => createThon({ ten_thon: tenThon, ma_thon: maThon }),
    onSuccess: () => {
      setTenThon("");
      setMaThon("");
      setError(null);
      invalidate();
    },
    onError: () => setError("Không thể thêm thôn (mã thôn có thể đã tồn tại)"),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => deactivateThon(id),
    onSuccess: invalidate,
  });

  const reactivateMutation = useMutation({
    mutationFn: (id: string) => updateThon(id, { trang_thai: "hoat_dong" }),
    onSuccess: invalidate,
  });

  // Sua ten Thon - CHI Admin duoc phep (trang nay da bi khoa boi ProtectedRoute
  // requireAdmin trong App.tsx, va backend cung chan bang require_admin).
  const renameMutation = useMutation({
    mutationFn: (id: string) => updateThon(id, { ten_thon: tenDangSua }),
    onSuccess: () => {
      setDangSuaId(null);
      invalidate();
    },
  });

  function batDauSuaTen(id: string, tenHienTai: string) {
    setDangSuaId(id);
    setTenDangSua(tenHienTai);
  }

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Quản lý Danh mục Thôn</h1>
        <p className="page-subtitle">Thêm mới, sửa tên, tạm ngừng hoạt động các thôn/địa bàn thuộc xã.</p>
      </div>

      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          style={{ display: "flex", gap: 12, alignItems: "end", flexWrap: "wrap" }}
        >
          <div className="field">
            <label className="label">Tên thôn</label>
            <input className="input" value={tenThon} onChange={(e) => setTenThon(e.target.value)} required />
          </div>
          <div className="field">
            <label className="label">Mã thôn</label>
            <input className="input" value={maThon} onChange={(e) => setMaThon(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary">
            <Plus size={15} /> Thêm mới Thôn
          </button>
        </form>
        {error && <div className="error-banner" style={{ marginTop: 12, marginBottom: 0 }}>{error}</div>}
      </div>

      {(deactivateMutation.isError || reactivateMutation.isError || renameMutation.isError) && (
        <div className="error-banner" style={{ marginBottom: 12 }}>
          {extractErrorMessage(deactivateMutation.error ?? reactivateMutation.error ?? renameMutation.error)}
        </div>
      )}

      <div className="card table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tên thôn</th>
              <th>Mã thôn</th>
              <th>Trạng thái</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {thonList.map((thon) => (
              <tr key={thon.id}>
                <td style={{ fontWeight: 600 }}>
                  {dangSuaId === thon.id ? (
                    <div style={{ display: "flex", gap: 6 }}>
                      <input
                        className="input"
                        style={{ width: 200 }}
                        value={tenDangSua}
                        onChange={(e) => setTenDangSua(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && tenDangSua.trim()) renameMutation.mutate(thon.id);
                          if (e.key === "Escape") setDangSuaId(null);
                        }}
                      />
                      <button
                        className="btn btn-primary btn-sm"
                        disabled={!tenDangSua.trim() || renameMutation.isPending}
                        onClick={() => renameMutation.mutate(thon.id)}
                      >
                        Lưu
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setDangSuaId(null)}>
                        Hủy
                      </button>
                    </div>
                  ) : (
                    thon.ten_thon
                  )}
                </td>
                <td className="text-muted">{thon.ma_thon}</td>
                <td>
                  <span className={`badge ${thon.trang_thai === "hoat_dong" ? "badge-green" : "badge-gray"}`}>
                    {thon.trang_thai === "hoat_dong" ? "Hoạt động" : "Ngừng hoạt động"}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 8 }}>
                    {dangSuaId !== thon.id && (
                      <button
                        onClick={() => batDauSuaTen(thon.id, thon.ten_thon)}
                        className="btn btn-secondary btn-sm"
                        title="Sửa tên Thôn (chỉ Quản trị viên)"
                      >
                        <Pencil size={13} /> Sửa tên
                      </button>
                    )}
                    {thon.trang_thai === "hoat_dong" ? (
                      <button onClick={() => deactivateMutation.mutate(thon.id)} className="btn btn-secondary btn-sm">
                        Ngừng hoạt động
                      </button>
                    ) : (
                      <button onClick={() => reactivateMutation.mutate(thon.id)} className="btn btn-secondary btn-sm">
                        Kích hoạt lại
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {thonList.length === 0 && !isLoading && (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: 32, color: "var(--color-text-muted)" }}>
                  Chưa có thôn nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
