import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { FileDown } from "lucide-react";
import { exportBaoCao } from "../api/reports";
import { listThon } from "../api/thon";
import { Layout } from "../components/Layout";
import { extractErrorMessage } from "../utils/errors";

export function ReportExportPage() {
  const [tuNgay, setTuNgay] = useState("");
  const [denNgay, setDenNgay] = useState("");
  const [thonId, setThonId] = useState("");

  const { data: thonList = [] } = useQuery({ queryKey: ["thon"], queryFn: listThon });

  const exportMutation = useMutation({
    mutationFn: () => exportBaoCao(tuNgay, denNgay, thonId || undefined),
  });

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Xuất báo cáo Excel thông minh</h1>
        <p className="page-subtitle">
          File Excel sẽ tổng hợp theo dạng ma trận: hàng dọc là Thôn, cột ngang là Lĩnh vực vi phạm hành chính
          (Đất đai, Xây dựng, Môi trường, Giao thông, An ninh trật tự), mỗi ô giao nhau gồm Tổng số vụ + Tổng số tiền
          phạt.
        </p>
      </div>

      <div className="card card-pad" style={{ maxWidth: 720 }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            exportMutation.mutate();
          }}
          style={{ display: "flex", gap: 14, alignItems: "end", flexWrap: "wrap" }}
        >
          <div className="field">
            <label className="label">Từ ngày</label>
            <input type="date" className="input" value={tuNgay} onChange={(e) => setTuNgay(e.target.value)} required />
          </div>
          <div className="field">
            <label className="label">Đến ngày</label>
            <input type="date" className="input" value={denNgay} onChange={(e) => setDenNgay(e.target.value)} required />
          </div>
          <div className="field">
            <label className="label">Thôn</label>
            <select className="input" value={thonId} onChange={(e) => setThonId(e.target.value)}>
              <option value="">Toàn xã</option>
              {thonList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.ten_thon}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={exportMutation.isPending} className="btn btn-primary">
            <FileDown size={15} /> {exportMutation.isPending ? "Đang xuất..." : "Xuất Excel"}
          </button>
        </form>

        {exportMutation.isError && (
          <div className="error-banner" style={{ marginTop: 16, marginBottom: 0 }}>
            {extractErrorMessage(exportMutation.error)}
          </div>
        )}
      </div>
    </Layout>
  );
}
