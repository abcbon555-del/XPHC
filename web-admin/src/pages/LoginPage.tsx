import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Landmark, MapPinned, ScrollText, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useConfig } from "../context/ConfigContext";

export function LoginPage() {
  const [tenDangNhap, setTenDangNhap] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const config = useConfig();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(tenDangNhap, matKhau);
      navigate("/");
    } catch {
      setError("Sai tên đăng nhập hoặc mật khẩu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-brand-panel">
        <div className="login-emblem">
          <Landmark size={28} strokeWidth={2} />
        </div>
        <div className="login-brand-title">{config.ten_don_vi}</div>
        <div className="login-brand-subtitle">{config.mo_ta_don_vi}</div>
        <div className="login-brand-features">
          <div className="login-brand-feature">
            <span className="login-brand-feature-icon">
              <MapPinned size={17} strokeWidth={2} />
            </span>
            Bản đồ số vi phạm theo thời gian thực
          </div>
          <div className="login-brand-feature">
            <span className="login-brand-feature-icon">
              <ScrollText size={17} strokeWidth={2} />
            </span>
            Hồ sơ điện tử, đánh số biên bản tự động
          </div>
          <div className="login-brand-feature">
            <span className="login-brand-feature-icon">
              <ShieldCheck size={17} strokeWidth={2} />
            </span>
            Phân quyền tài khoản, nhật ký minh bạch
          </div>
        </div>

        <div className="login-brand-footer">
          {config.ten_co_quan_chu_quan} · Hệ thống nội bộ phục vụ công tác quản lý trật tự đô thị và đất đai
        </div>
      </div>

      <div className="login-form-panel">
        <form onSubmit={handleSubmit} className="login-card">
          <h2>Đăng nhập</h2>
          <div className="login-card-subtitle">Nhập tài khoản được cấp để tiếp tục</div>

          {error && <div className="error-banner">{error}</div>}

          <div className="field" style={{ marginBottom: 16 }}>
            <label className="label" htmlFor="username">
              Tên đăng nhập
            </label>
            <input
              id="username"
              className="input"
              value={tenDangNhap}
              onChange={(e) => setTenDangNhap(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="field" style={{ marginBottom: 24 }}>
            <label className="label" htmlFor="password">
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              className="input"
              value={matKhau}
              onChange={(e) => setMatKhau(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%" }}>
            {loading ? "Đang xử lý..." : "Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );
}
