import type { ReactNode } from "react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FilePlus2, FolderClosed, MapPinned, Users, FileSpreadsheet, ScrollText, LogOut, Landmark, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useConfig } from "../context/ConfigContext";
import { resolveFileUrl } from "../api/client";

interface NavItem {
  to: string;
  label: string;
  icon: typeof MapPinned;
  adminOnly: boolean;
  permission?: "quyen_xuat_bao_cao" | "quyen_nhap_lieu";
}

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Bản đồ vi phạm", icon: MapPinned, adminOnly: false },
  { to: "/ho-so/moi", label: "Lập Biên Bản Kiểm Tra Hiện Trạng", icon: FilePlus2, adminOnly: false, permission: "quyen_nhap_lieu" },
  { to: "/ho-so", label: "Danh sách hồ sơ", icon: FolderClosed, adminOnly: false },
  { to: "/thon", label: "Quản lý Thôn", icon: LayoutDashboard, adminOnly: true },
  { to: "/nguoi-dung", label: "Quản lý Tài khoản", icon: Users, adminOnly: true },
  { to: "/bao-cao", label: "Xuất báo cáo Excel", icon: FileSpreadsheet, adminOnly: false, permission: "quyen_xuat_bao_cao" },
  { to: "/audit-log", label: "Nhật ký hệ thống", icon: ScrollText, adminOnly: true },
];

function initials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts.length === 1 ? parts[0][0] : parts[0][0] + parts[parts.length - 1][0];
}

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const config = useConfig();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (user?.chi_lap_bien_ban && !user?.is_admin) return item.to === "/ho-so/moi";
    if (item.adminOnly) return !!user?.is_admin;
    if (item.permission) return !!(user?.is_admin || user?.[item.permission]);
    return true;
  });

  return (
    <div className="app-shell">
      <header className="app-mobile-topbar">
        <button
          className="app-mobile-menu-btn"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Mở menu"
        >
          <Menu size={22} strokeWidth={2} />
        </button>
        <div className="app-mobile-topbar-brand">
          <div className="app-sidebar-emblem app-sidebar-emblem-sm">
            <Landmark size={16} strokeWidth={2} />
          </div>
          {config.ten_don_vi}
        </div>
      </header>

      {mobileNavOpen && <div className="app-sidebar-backdrop" onClick={() => setMobileNavOpen(false)} />}

      <aside className={`app-sidebar${mobileNavOpen ? " open" : ""}`}>
        <button
          className="app-sidebar-close-btn"
          onClick={() => setMobileNavOpen(false)}
          aria-label="Đóng menu"
        >
          <X size={20} strokeWidth={2} />
        </button>
        <div className="app-sidebar-brand">
          <div className="app-sidebar-emblem">
            <Landmark size={20} strokeWidth={2} />
          </div>
          <div className="app-sidebar-brand-text">
            <div className="app-sidebar-brand-title">{config.ten_don_vi}</div>
            <div className="app-sidebar-brand-subtitle">{config.ten_dia_phuong}</div>
          </div>
        </div>

        <nav className="app-nav">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`app-nav-link${active ? " active" : ""}`}
                onClick={() => setMobileNavOpen(false)}
              >
                <Icon size={17} strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="app-sidebar-footer">
          <div className="app-user">
            <div className="app-user-avatar">
              {user?.anh_dai_dien ? (
                <img src={resolveFileUrl(user.anh_dai_dien)} alt={user.ho_ten} />
              ) : (
                initials(user?.ho_ten)
              )}
            </div>
            <div>
              <div className="app-user-name">{user?.ho_ten}</div>
              <div className="app-user-role">{user?.chuc_vu || (user?.is_admin ? "Quản trị viên" : "")}</div>
            </div>
          </div>
          <button onClick={logout} className="btn btn-secondary btn-sm" style={{ width: "100%" }}>
            <LogOut size={14} /> Đăng xuất
          </button>
        </div>
      </aside>
      <main className="app-main">{children}</main>
    </div>
  );
}
