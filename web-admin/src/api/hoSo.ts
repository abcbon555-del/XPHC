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

export async function updateHoSo(
  id: string,
  payload: Partial<Pick<HoSoViPham, "trang_thai_xu_ly" | "so_tien_phat" | "hanh_vi_mo_ta_them">>
) {
  const { data } = await apiClient.put(`/ho-so/${id}`, payload);
  return data as HoSoViPham;
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
