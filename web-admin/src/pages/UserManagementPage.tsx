import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import {
  createNguoiDung,
  deactivateNguoiDung,
  deleteAvatar,
  listNguoiDung,
  updateNguoiDung,
  uploadAvatar,
  xoaVinhVienNguoiDung,
} from "../api/nguoiDung";
import { listThon } from "../api/thon";
import { resolveFileUrl } from "../api/client";
import type { NguoiDung, PhamViXem } from "../types";
import { Layout } from "../components/Layout";
import { extractErrorMessage } from "../utils/errors";

interface FormState {
  ten_dang_nhap: string;
  mat_khau: string;
  ho_ten: string;
  chuc_vu: string;
  so_dt: string;
  email: string;
  quyen_nhap_lieu: boolean;
  quyen_upload_tai_lieu: boolean;
  pham_vi_xem: PhamViXem;
  quyen_xuat_bao_cao: boolean;
  thon_phu_trach_id: string;
}

const EMPTY_FORM: FormState = {
  ten_dang_nhap: "",
  mat_khau: "",
  ho_ten: "",
  chuc_vu: "",
  so_dt: "",
  email: "",
  quyen_nhap_lieu: false,
  quyen_upload_tai_lieu: false,
  pham_vi_xem: "gioi_han",
  quyen_xuat_bao_cao: false,
  thon_phu_trach_id: "",
};

function initials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts.length === 1 ? parts[0][0] : parts[0][0] + parts[parts.length - 1][0];
}

function AvatarThumb({ user, size = 34 }: { user: NguoiDung; size?: number }) {
  const src = resolveFileUrl(user.anh_dai_dien);
  if (src) {
    return (
      <img
        src={src}
        alt={user.ho_ten}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: "1px solid var(--color-border)" }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "var(--color-primary-light)",
        color: "var(--color-primary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.4,
        fontWeight: 700,
      }}
    >
      {initials(user.ho_ten)}
    </div>
  );
}

export function UserManagementPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: users = [], isLoading } = useQuery({ queryKey: ["nguoi-dung"], queryFn: listNguoiDung });
  const { data: thonList = [] } = useQuery({ queryKey: ["thon"], queryFn: listThon });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["nguoi-dung"] });

  const editingUser = editingId ? users.find((u) => u.id === editingId) : undefined;

  const createMutation = useMutation({
    mutationFn: () =>
      createNguoiDung({
        ten_dang_nhap: form.ten_dang_nhap,
        mat_khau: form.mat_khau,
        ho_ten: form.ho_ten,
        chuc_vu: form.chuc_vu || undefined,
        so_dt: form.so_dt || undefined,
        email: form.email || undefined,
        quyen_nhap_lieu: form.quyen_nhap_lieu,
        quyen_upload_tai_lieu: form.quyen_upload_tai_lieu,
        pham_vi_xem: form.pham_vi_xem,
        quyen_xuat_bao_cao: form.quyen_xuat_bao_cao,
        thon_phu_trach_id: form.thon_phu_trach_id || null,
      }),
    onSuccess: () => {
      setForm(EMPTY_FORM);
      invalidate();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (id: string) =>
      updateNguoiDung(id, {
        ho_ten: form.ho_ten,
        chuc_vu: form.chuc_vu || undefined,
        so_dt: form.so_dt || undefined,
        email: form.email || undefined,
        quyen_nhap_lieu: form.quyen_nhap_lieu,
        quyen_upload_tai_lieu: form.quyen_upload_tai_lieu,
        pham_vi_xem: form.pham_vi_xem,
        quyen_xuat_bao_cao: form.quyen_xuat_bao_cao,
        thon_phu_trach_id: form.thon_phu_trach_id || null,
      }),
    onSuccess: () => {
      setForm(EMPTY_FORM);
      setEditingId(null);
      invalidate();
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => deactivateNguoiDung(id),
    onSuccess: invalidate,
  });

  const xoaVinhVienMutation = useMutation({
    mutationFn: (id: string) => xoaVinhVienNguoiDung(id),
    onSuccess: invalidate,
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => uploadAvatar(id, file),
    onSuccess: invalidate,
  });

  const deleteAvatarMutation = useMutation({
    mutationFn: (id: string) => deleteAvatar(id),
    onSuccess: invalidate,
  });

  const formError = createMutation.error ?? updateMutation.error ?? uploadAvatarMutation.error ?? deleteAvatarMutation.error;

  function startEdit(user: NguoiDung) {
    setEditingId(user.id);
    setForm({
      ten_dang_nhap: user.ten_dang_nhap,
      mat_khau: "",
      ho_ten: user.ho_ten,
      chuc_vu: user.chuc_vu ?? "",
      so_dt: user.so_dt ?? "",
      email: user.email ?? "",
      quyen_nhap_lieu: user.quyen_nhap_lieu,
      quyen_upload_tai_lieu: user.quyen_upload_tai_lieu,
      pham_vi_xem: user.pham_vi_xem,
      quyen_xuat_bao_cao: user.quyen_xuat_bao_cao,
      thon_phu_trach_id: user.thon_phu_trach_id ?? "",
    });
  }

  function handleDeactivate(user: NguoiDung) {
    if (window.confirm(`Xóa tài khoản "${user.ho_ten}"? Tài khoản sẽ bị vô hiệu hóa (giữ lại lịch sử hồ sơ đã lập).`)) {
      deactivateMutation.mutate(user.id);
    }
  }

  function handleXoaVinhVien(user: NguoiDung) {
    if (
      window.confirm(
        `Xóa VĨNH VIỄN tài khoản "${user.ho_ten}"? Chỉ thực hiện được nếu tài khoản này chưa từng có hoạt động nào được ghi lại (chưa lập hồ sơ/tải tệp). Không thể hoàn tác.`
      )
    ) {
      xoaVinhVienMutation.mutate(user.id);
    }
  }

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Quản lý Tài khoản và Phân quyền</h1>
        <p className="page-subtitle">Tạo tài khoản nhân sự và phân quyền chi tiết theo từng đầu mục công việc.</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (editingId) updateMutation.mutate(editingId);
          else createMutation.mutate();
        }}
        className="card card-pad"
        style={{ marginBottom: 20, maxWidth: 480, display: "flex", flexDirection: "column", gap: 14 }}
      >
        <h3 style={{ fontSize: 15 }}>{editingId ? "Sửa tài khoản" : "Tạo tài khoản mới"}</h3>

        {formError && <div className="error-banner">{extractErrorMessage(formError)}</div>}

        {editingId && editingUser && (
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <AvatarThumb user={editingUser} size={56} />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadAvatarMutation.mutate({ id: editingId, file });
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadAvatarMutation.isPending}
              >
                {uploadAvatarMutation.isPending ? "Đang tải..." : "Đổi ảnh đại diện"}
              </button>
              {editingUser.anh_dai_dien && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => deleteAvatarMutation.mutate(editingId)}
                  disabled={deleteAvatarMutation.isPending}
                >
                  Xóa ảnh
                </button>
              )}
            </div>
          </div>
        )}

        {!editingId && (
          <>
            <div className="field">
              <label className="label">Tên đăng nhập</label>
              <input
                className="input"
                value={form.ten_dang_nhap}
                onChange={(e) => setForm({ ...form, ten_dang_nhap: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label className="label">Mật khẩu</label>
              <input
                type="password"
                className="input"
                value={form.mat_khau}
                onChange={(e) => setForm({ ...form, mat_khau: e.target.value })}
                required
              />
            </div>
          </>
        )}

        <div className="field">
          <label className="label">Họ tên</label>
          <input
            className="input"
            value={form.ho_ten}
            onChange={(e) => setForm({ ...form, ho_ten: e.target.value })}
            required
          />
        </div>
        <div className="field">
          <label className="label">Chức vụ</label>
          <input className="input" value={form.chuc_vu} onChange={(e) => setForm({ ...form, chuc_vu: e.target.value })} />
        </div>
        <div className="field">
          <label className="label">Số điện thoại</label>
          <input className="input" value={form.so_dt} onChange={(e) => setForm({ ...form, so_dt: e.target.value })} />
        </div>
        <div className="field">
          <label className="label">Email</label>
          <input
            type="email"
            className="input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div className="field">
          <label className="label">Thôn phụ trách (dùng khi Xem giới hạn)</label>
          <select
            className="input"
            value={form.thon_phu_trach_id}
            onChange={(e) => setForm({ ...form, thon_phu_trach_id: e.target.value })}
          >
            <option value="">-- Không gán --</option>
            {thonList.map((t) => (
              <option key={t.id} value={t.id}>
                {t.ten_thon}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="field-group">
          <legend>Phân quyền</legend>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={form.quyen_nhap_lieu}
                onChange={(e) => setForm({ ...form, quyen_nhap_lieu: e.target.checked })}
              />
              Quyền Nhập liệu (lập biên bản App/Web)
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={form.quyen_upload_tai_lieu}
                onChange={(e) => setForm({ ...form, quyen_upload_tai_lieu: e.target.checked })}
              />
              Quyền Tải lên tài liệu (Quyết định, Biên lai...)
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={form.quyen_xuat_bao_cao}
                onChange={(e) => setForm({ ...form, quyen_xuat_bao_cao: e.target.checked })}
              />
              Quyền Xuất báo cáo Excel
            </label>

            <div style={{ marginTop: 4, paddingTop: 10, borderTop: "1px solid var(--color-border)" }}>
              <div className="label" style={{ marginBottom: 8 }}>
                Quyền Xem dữ liệu
              </div>
              <label className="checkbox-row" style={{ marginBottom: 6 }}>
                <input
                  type="radio"
                  name="pham_vi_xem"
                  checked={form.pham_vi_xem === "gioi_han"}
                  onChange={() => setForm({ ...form, pham_vi_xem: "gioi_han" })}
                />
                Xem giới hạn (chỉ hồ sơ của mình / thôn phụ trách)
              </label>
              <label className="checkbox-row">
                <input
                  type="radio"
                  name="pham_vi_xem"
                  checked={form.pham_vi_xem === "toan_bo"}
                  onChange={() => setForm({ ...form, pham_vi_xem: "toan_bo" })}
                />
                Xem toàn bộ (toàn xã)
              </label>
            </div>
          </div>
        </fieldset>

        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" className="btn btn-primary">
            {editingId ? "Lưu thay đổi" : "Tạo tài khoản"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(EMPTY_FORM);
              }}
              className="btn btn-secondary"
            >
              Hủy
            </button>
          )}
        </div>
      </form>

      {(deactivateMutation.error || xoaVinhVienMutation.error) && (
        <div className="error-banner" style={{ marginBottom: 12 }}>
          {extractErrorMessage(deactivateMutation.error ?? xoaVinhVienMutation.error)}
        </div>
      )}

      <div className="card table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th></th>
              <th>Tên đăng nhập</th>
              <th>Họ tên</th>
              <th>Chức vụ</th>
              <th>Trạng thái</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <AvatarThumb user={u} />
                </td>
                <td style={{ fontWeight: 600 }}>{u.ten_dang_nhap}</td>
                <td>{u.ho_ten}</td>
                <td className="text-muted">{u.chuc_vu}</td>
                <td>
                  <span className={`badge ${u.is_active ? "badge-green" : "badge-gray"}`}>
                    {u.is_active ? "Hoạt động" : "Đã vô hiệu hóa"}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => startEdit(u)} className="btn btn-secondary btn-sm">
                      Sửa
                    </button>
                    {!u.is_admin && u.is_active && (
                      <button onClick={() => handleDeactivate(u)} className="btn btn-danger btn-sm">
                        Xóa tài khoản
                      </button>
                    )}
                    {!u.is_admin && (
                      <button
                        onClick={() => handleXoaVinhVien(u)}
                        className="btn btn-danger btn-sm"
                        disabled={xoaVinhVienMutation.isPending}
                        title="Xóa vĩnh viễn khỏi hệ thống (chỉ thành công nếu chưa từng có hoạt động)"
                      >
                        <Trash2 size={13} /> Xóa vĩnh viễn
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && !isLoading && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 32, color: "var(--color-text-muted)" }}>
                  Chưa có tài khoản nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
