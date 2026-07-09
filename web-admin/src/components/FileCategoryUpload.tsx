import { useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Trash2, UploadCloud } from "lucide-react";
import { deleteHoSoFile, listHoSoFiles, uploadHoSoFile } from "../api/hoSo";
import type { DanhMucFile } from "../types";
import { useAuth } from "../context/AuthContext";
import { resolveFileUrl } from "../api/client";
import { extractErrorMessage } from "../utils/errors";

interface Props {
  hoSoId: string;
  danhMuc: DanhMucFile;
  title: string;
}

export function FileCategoryUpload({ hoSoId, danhMuc, title }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: allFiles = [] } = useQuery({
    queryKey: ["ho-so-files", hoSoId],
    queryFn: () => listHoSoFiles(hoSoId),
  });
  const files = allFiles.filter((f) => f.danh_muc === danhMuc);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadHoSoFile(hoSoId, danhMuc, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ho-so-files", hoSoId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (fileId: string) => deleteHoSoFile(hoSoId, fileId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ho-so-files", hoSoId] }),
  });

  const canUpload = user?.is_admin || user?.quyen_upload_tai_lieu;

  return (
    <div className="card card-pad" style={{ display: "flex", flexDirection: "column" }}>
      <h4 style={{ fontSize: 13.5, marginBottom: 12, lineHeight: 1.4 }}>{title}</h4>

      <div style={{ flex: 1, marginBottom: 12 }}>
        {files.length === 0 && (
          <div className="text-muted" style={{ fontSize: 13 }}>
            Chưa có tệp đính kèm
          </div>
        )}
        {files.map((f) => (
          <div
            key={f.id}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--color-border)" }}
          >
            <FileText size={15} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
            <a
              href={resolveFileUrl(f.duong_dan)}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 13, color: "var(--color-accent)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            >
              {f.ten_file_goc}
            </a>
            {canUpload && (
              <button
                onClick={() => deleteMutation.mutate(f.id)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-danger)", padding: 2 }}
                title="Xóa tệp"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      {(uploadMutation.isError || deleteMutation.isError) && (
        <div className="error-banner" style={{ marginBottom: 12, fontSize: 12.5 }}>
          {extractErrorMessage(uploadMutation.error ?? deleteMutation.error)}
        </div>
      )}

      {canUpload && (
        <label className="btn btn-secondary btn-sm" style={{ cursor: "pointer", justifyContent: "flex-start" }}>
          <UploadCloud size={14} />
          {uploadMutation.isPending ? "Đang tải lên..." : "Tải tệp lên"}
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadMutation.mutate(file);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
          />
        </label>
      )}
    </div>
  );
}
