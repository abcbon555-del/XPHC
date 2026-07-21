import { apiClient } from "./client";
import type { DanhMucFile, HoSoFile, HoSoViPham, TrangThaiHoSo } from "../types";

export interface HoSoFilter {
  thon_id?: string;
  linh_vuc_id?: string;
  trang_thai_xu_ly?: TrangThaiHoSo;
  tu_ngay?: string;
  den_ngay?: string;
}

export async function listHoSo(filter: HoSoFilter = {}): Promise<HoSoViPham[]> {
  const { data } = await apiClient.get("/ho-so", { params: filter });
  return data;
}

// Danh sach day du cho Ban do so - khong bi gioi han theo pham_vi_xem cua tai khoan,
// de moi can bo deu thay toan bo vu viec tren dia ban khi xem ban do tong quan.
export async function listHoSoBanDo(filter: Pick<HoSoFilter, "thon_id" | "trang_thai_xu_ly"> = {}): Promise<HoSoViPham[]> {
  const { data } = await apiClient.get("/ho-so/ban-do", { params: filter });
  return data;
}

// Chi Admin: tai toan bo ho so (theo Thon -> vu viec, kem anh + tai lieu) ve may dang ZIP.
export async function taiToanBoHoSoZip(): Promise<void> {
  const res = await apiClient.get("/ho-so/xuat-ho-so-giay", { responseType: "blob" });
  // Lay ten file tu Content-Disposition, fallback theo ngay
  let tenFile = `Ho-so-vi-pham-${new Date().toISOString().slice(0, 10)}.zip`;
  const cd = res.headers["content-disposition"] as string | undefined;
  const match = cd?.match(/filename="?([^"]+)"?/);
  if (match) tenFile = match[1];

  const url = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = tenFile;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function getHoSo(id: string): Promise<HoSoViPham> {
  const { data } = await apiClient.get(`/ho-so/${id}`);
  return data;
}

export interface HoSoCreatePayload {
  doi_tuong_id: string;
  thon_id: string;
  linh_vuc_id: string;
  hanh_vi_id?: string;
  hanh_vi_mo_ta_them?: string;
  kinh_do: number;
  vi_do: number;
  dia_chi_map?: string;
  so_tien_phat?: number;
}

export async function createHoSo(payload: HoSoCreatePayload): Promise<HoSoViPham> {
  const { data } = await apiClient.post("/ho-so", payload);
  return data;
}

export interface HoSoUpdatePayload
  extends Partial<
    Pick<
      HoSoViPham,
      | "trang_thai_xu_ly"
      | "so_tien_phat"
      | "hanh_vi_mo_ta_them"
      | "kinh_do"
      | "vi_do"
      | "dia_chi_map"
      | "doi_tuong_id"
      | "thon_id"
      | "linh_vuc_id"
    >
  > {
  hanh_vi_id?: string | null;
}

export async function updateHoSo(id: string, payload: HoSoUpdatePayload) {
  const { data } = await apiClient.put(`/ho-so/${id}`, payload);
  return data as HoSoViPham;
}

// Chi Quan tri vien duoc phep (backend kiem tra require_admin).
export async function deleteHoSo(id: string) {
  await apiClient.delete(`/ho-so/${id}`);
}

export async function listHoSoFiles(hoSoId: string): Promise<HoSoFile[]> {
  const { data } = await apiClient.get(`/ho-so/${hoSoId}/files`);
  return data;
}

export async function uploadHoSoFile(hoSoId: string, danhMuc: DanhMucFile, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post(`/ho-so/${hoSoId}/files`, formData, {
    params: { danh_muc: danhMuc },
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data as HoSoFile;
}

export async function deleteHoSoFile(hoSoId: string, fileId: string) {
  await apiClient.delete(`/ho-so/${hoSoId}/files/${fileId}`);
}
