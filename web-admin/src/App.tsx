import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ConfigProvider } from "./context/ConfigContext";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { DashboardMapPage } from "./pages/DashboardMapPage";
import { HoSoListPage } from "./pages/HoSoListPage";
import { HoSoDetailPage } from "./pages/HoSoDetailPage";
import { NewHoSoPage } from "./pages/NewHoSoPage";
import { ThonManagementPage } from "./pages/ThonManagementPage";
import { UserManagementPage } from "./pages/UserManagementPage";
import { ReportExportPage } from "./pages/ReportExportPage";
import { AuditLogPage } from "./pages/AuditLogPage";

export default function App() {
  return (
    <ConfigProvider>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardMapPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ho-so"
            element={
              <ProtectedRoute>
                <HoSoListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ho-so/moi"
            element={
              <ProtectedRoute requirePermission={(u) => u.is_admin || u.quyen_nhap_lieu}>
                <NewHoSoPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ho-so/:id"
            element={
              <ProtectedRoute>
                <HoSoDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/thon"
            element={
              <ProtectedRoute requireAdmin>
                <ThonManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/nguoi-dung"
            element={
              <ProtectedRoute requireAdmin>
                <UserManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bao-cao"
            element={
              <ProtectedRoute requirePermission={(u) => u.is_admin || u.quyen_xuat_bao_cao}>
                <ReportExportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit-log"
            element={
              <ProtectedRoute requireAdmin>
                <AuditLogPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ConfigProvider>
  );
}
