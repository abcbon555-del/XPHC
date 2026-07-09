import { apiClient } from "./client";
import type { HanhViViPham, LinhVucViPham } from "../types";

export async function listLinhVuc(): Promise<LinhVucViPham[]> {
  const { data } = await apiClient.get("/linh-vuc");
  return data;
}

export async function listHanhVi(): Promise<HanhViViPham[]> {
  const { data } = await apiClient.get("/hanh-vi");
  return data;
}
