import axios from "axios";

// Tu dong suy ra dia chi API tu host dang truy cap trang (localhost hoac IP LAN khi
// mo tu dien thoai/thiet bi khac) - tranh phai sua tay moi khi IP LAN thay doi do DHCP.
// VITE_API_BASE_URL van co the ghi de neu can (vi du trien khai domain rieng).
function resolveDefaultApiBase(): string {
  if (typeof window === "undefined") return "http://localhost:8000/api/v1";
  return `${window.location.protocol}//${window.location.hostname}:8000/api/v1`;
}

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? resolveDefaultApiBase();

const ACCESS_TOKEN_KEY = "xphc_access_token";
const REFRESH_TOKEN_KEY = "xphc_refresh_token";

export const tokenStorage = {
  getAccess: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  set: (access: string, refresh: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

export const apiClient = axios.create({ baseURL: API_BASE_URL });

apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.getAccess();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = tokenStorage.getRefresh();
  if (!refreshToken) throw new Error("Không có token làm mới");
  const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refresh_token: refreshToken });
  tokenStorage.set(data.access_token, data.refresh_token);
  return data.access_token as string;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
        const newToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch {
        tokenStorage.clear();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ===== Tep dinh kem: tai qua endpoint co xac thuc (khong con URL public) =====

// Tai tep ve dang Blob object URL de gan vao <img>. Nho revoke sau khi dung (xem SecureImage).
export async function fetchFileObjectUrl(duongDan?: string | null): Promise<string | undefined> {
  if (!duongDan) return undefined;
  const { data } = await apiClient.get("/files/tai-xuong", {
    params: { path: duongDan },
    responseType: "blob",
  });
  return URL.createObjectURL(data);
}

// Tai tep xuong may (dung cho tep khong phai anh: PDF, Word, Excel...).
export async function downloadFile(duongDan: string, tenFile: string): Promise<void> {
  const { data } = await apiClient.get("/files/tai-xuong", {
    params: { path: duongDan },
    responseType: "blob",
  });
  const url = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = tenFile;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
