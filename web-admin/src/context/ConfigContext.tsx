import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { fetchConfig } from "../api/config";
import type { PublicConfig } from "../types";

// Gia tri mac dinh dung tam trong luc cho API /config phan hoi (hoac neu API loi) -
// tranh man hinh trang. Se duoc ghi de ngay khi fetchConfig() thanh cong.
const DEFAULT_CONFIG: PublicConfig = {
  ten_don_vi: "Phần mềm quản lý XPHC",
  ten_dia_phuong: "",
  ten_co_quan_chu_quan: "",
  mo_ta_don_vi: "Hệ thống quản lý xử lý vi phạm hành chính, trật tự xây dựng, đất đai.",
  ban_do_vi_do_mac_dinh: 21.0278,
  ban_do_kinh_do_mac_dinh: 105.8342,
  ban_do_zoom_mac_dinh: 13,
  logo_url: null,
};

const ConfigContext = createContext<PublicConfig>(DEFAULT_CONFIG);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<PublicConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    fetchConfig()
      .then((data) => {
        setConfig(data);
        document.title = data.ten_dia_phuong ? `${data.ten_don_vi} - ${data.ten_dia_phuong}` : data.ten_don_vi;
      })
      .catch(() => {
        /* giu gia tri mac dinh neu khong lay duoc cau hinh tu server */
      });
  }, []);

  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>;
}

export function useConfig() {
  return useContext(ConfigContext);
}
