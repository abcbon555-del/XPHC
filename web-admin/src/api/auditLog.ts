import { apiClient } from "./client";
import type { AuditLogEntry } from "../types";

export async function listAuditLog(params: { tu_ngay?: string; den_ngay?: string } = {}): Promise<AuditLogEntry[]> {
  const { data } = await apiClient.get("/audit-log", { params });
  return data;
}
