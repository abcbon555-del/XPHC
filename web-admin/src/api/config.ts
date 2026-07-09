import { apiClient } from "./client";
import type { PublicConfig } from "../types";

export async function fetchConfig(): Promise<PublicConfig> {
  const { data } = await apiClient.get("/config");
  return data;
}
