import { apiClient } from "./client";

export async function exportBaoCao(tuNgay: string, denNgay: string, thonId?: string) {
  const response = await apiClient.get("/reports/export", {
    params: { tu_ngay: tuNgay, den_ngay: denNgay, thon_id: thonId || undefined },
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `bao_cao_vphc_${tuNgay}_${denNgay}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
