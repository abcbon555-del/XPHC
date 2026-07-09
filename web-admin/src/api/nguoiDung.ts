import { apiClient } from "./client";
import type { NguoiDung, PhamViXem } from "../types";

export interface NguoiDungPayload {
  ten_dang_nhap?: string;
  mat_khau?: string;
  ho_ten: string;
  chuc_vu?: string;
  so_dt?: string;
  email?: string;
  quyen_nhap_lieu: boolean;
  quyen_upload_tai_lieu: boolean;
  pham_vi_xem: PhamViXem;
  quyen_xuat_bao_cao: boolean;
  thon_phu_trach_id?: string | null;
}

export async function listNguoiDung(): Promise<NguoiDung[]> {
  const { data } = await apiClient.get("/nguoi-dung");
  return data;
}

export async function createNguoiDung(payload: NguoiDungPayload) {
  const { data } = await apiClient.post("/nguoi-dung", payload);
  return data as NguoiDung;
}

export async function updateNguoiDung(id: string, payload: Partial<NguoiDungPayload> & { is_active?: boolean }) {
  const { data } = await apiClient.put(`/nguoi-dung/${id}`, payload);
  return data as NguoiDung;
}

export async function deactivateNguoiDung(id: string) {
  await apiClient.delete(`/nguoi-dung/${id}`);
}

// Xoa cung - chi thanh cong neu tai khoan chua tung co hoat dong nao duoc ghi lai
// (backend tra 409 neu da co lich su, luc do nen dung deactivateNguoiDung thay the).
export async function xoaVinhVienNguoiDung(id: string) {
  await apiClient.delete(`/nguoi-dung/${id}/vinh-vien`);
}

export async function uploadAvatar(id: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post(`/nguoi-dung/${id}/avatar`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data as NguoiDung;
}

export async function deleteAvatar(id: string) {
  const { data } = await apiClient.delete(`/nguoi-dung/${id}/avatar`);
  return data as NguoiDung;
}
