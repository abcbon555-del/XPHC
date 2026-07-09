import { apiClient } from "./client";
import type { Thon } from "../types";

export async function listThon(): Promise<Thon[]> {
  const { data } = await apiClient.get("/thon");
  return data;
}

export async function createThon(payload: { ten_thon: string; ma_thon: string; ghi_chu?: string }) {
  const { data } = await apiClient.post("/thon", payload);
  return data as Thon;
}

export async function updateThon(id: string, payload: Partial<Pick<Thon, "ten_thon" | "ghi_chu" | "trang_thai">>) {
  const { data } = await apiClient.put(`/thon/${id}`, payload);
  return data as Thon;
}

export async function deactivateThon(id: string) {
  await apiClient.delete(`/thon/${id}`);
}
