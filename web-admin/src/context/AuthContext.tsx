import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { fetchMe, login as loginApi, logout as logoutApi } from "../api/auth";
import { tokenStorage } from "../api/client";
import type { NguoiDung } from "../types";

interface AuthContextValue {
  user: NguoiDung | null;
  isLoading: boolean;
  login: (tenDangNhap: string, matKhau: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<NguoiDung | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = tokenStorage.getAccess();
    if (!token) {
      setIsLoading(false);
      return;
    }
    fetchMe()
      .then(setUser)
      .catch(() => tokenStorage.clear())
      .finally(() => setIsLoading(false));
  }, []);

  async function login(tenDangNhap: string, matKhau: string) {
    await loginApi(tenDangNhap, matKhau);
    const me = await fetchMe();
    setUser(me);
  }

  function logout() {
    logoutApi();
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, isLoading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth phai dung trong AuthProvider");
  return ctx;
}
