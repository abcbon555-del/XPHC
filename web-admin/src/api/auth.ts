import { apiClient, tokenStorage } from "./client";
import type { NguoiDung } from "../types";

export async function login(ten_dang_nhap: string, mat_khau: string) {
  const { data } = await apiClient.post("/auth/login", { ten_dang_nhap, mat_khau });
  tokenStorage.set(data.access_token, data.refresh_token);
  return data;
}

export function logout() {
  tokenStorage.clear();
}

export async function fetchMe(): Promise<NguoiDung> {
  const { data } = await apiClient.get("/auth/me");
  return data;
}
