import { apiClient } from "./client";
import type { DoiTuongViPham } from "../types";

export async function searchDoiTuong(q?: string): Promise<DoiTuongViPham[]> {
  const { data } = await apiClient.get("/doi-tuong", { params: q ? { q } : {} });
  return data;
}

export async function getDoiTuong(id: string): Promise<DoiTuongViPham> {
  const { data } = await apiClient.get(`/doi-tuong/${id}`);
  return data;
}

export interface DoiTuongPayload {
  ho_ten: string;
  so_cccd?: string;
  so_dt?: string;
  dia_chi?: string;
}

export async function createDoiTuong(payload: DoiTuongPayload): Promise<DoiTuongViPham> {
  const { data } = await apiClient.post("/doi-tuong", payload);
  return data;
}
