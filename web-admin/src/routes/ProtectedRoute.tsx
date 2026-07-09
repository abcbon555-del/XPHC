import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface Props {
  children: ReactNode;
  requireAdmin?: boolean;
  requirePermission?: (user: NonNullable<ReturnType<typeof useAuth>["user"]>) => boolean;
}

export function ProtectedRoute({ children, requireAdmin, requirePermission }: Props) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="p-8">Đang tải...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requireAdmin && !user.is_admin) return <Navigate to="/" replace />;
  if (requirePermission && !requirePermission(user)) return <Navigate to="/" replace />;

  return <>{children}</>;
}
