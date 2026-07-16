import L from "leaflet";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { HoSoViPham, TrangThaiHoSo, Thon } from "../types";
import { useConfig } from "../context/ConfigContext";

// Fix icon mac dinh cua Leaflet khi bundle voi Vite
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const MAU_THEO_TRANG_THAI: Record<TrangThaiHoSo, string> = {
  moi_phat_hien: "#e53935", // Do
  da_ra_quyet_dinh: "#f59e0b", // Vang
  da_giai_quyet_dut_diem: "#22a06b", // Xanh la
};

const TRANG_THAI_TEXT: Record<TrangThaiHoSo, string> = {
  moi_phat_hien: "Mới phát hiện",
  da_ra_quyet_dinh: "Đã ra Quyết định",
  da_giai_quyet_dut_diem: "Đã giải quyết dứt điểm",
};

function makeColoredIcon(color: string) {
  return L.divIcon({
    className: "xphc-pin",
    html: `<div style="width:18px;height:18px;border-radius:50% 50% 50% 0;background:${color};transform:rotate(-45deg);border:2px solid white;box-shadow:0 0 3px rgba(0,0,0,.5)"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 18],
    popupAnchor: [0, -18],
  });
}

interface Props {
  hoSoList: HoSoViPham[];
  thonMap: Record<string, Thon>;
}

export function MapView({ hoSoList, thonMap }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const navigate = useNavigate();
  const config = useConfig();

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const osmLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    });

    // Khong co lop "ve tinh" chinh thuc tu OpenStreetMap - dung Esri World Imagery (mien phi, khong can API key)
    // de dat duoc "che do ve tinh" nhu yeu cau. Xem giai thich trong docs/ARCHITECTURE.md muc 3.
    const satelliteLayer = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { attribution: "Tiles &copy; Esri" }
    );

    const map = L.map(containerRef.current, {
      center: [config.ban_do_vi_do_mac_dinh, config.ban_do_kinh_do_mac_dinh],
      zoom: config.ban_do_zoom_mac_dinh,
      layers: [osmLayer],
    });

    L.control
      .layers({ "Bản đồ (OSM)": osmLayer, "Vệ tinh (Esri)": satelliteLayer }, undefined, { position: "topright" })
      .addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const layer = markersLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    hoSoList.forEach((hoSo) => {
      const icon = makeColoredIcon(MAU_THEO_TRANG_THAI[hoSo.trang_thai_xu_ly]);
      const marker = L.marker([hoSo.vi_do, hoSo.kinh_do], { icon });

      const thonTen = thonMap[hoSo.thon_id]?.ten_thon ?? "";
      const popupHtml = document.createElement("div");
      popupHtml.style.cssText = "min-width:220px;font-family:var(--font-sans, inherit);font-size:13px;line-height:1.7";

      // Dung textContent (khong dung innerHTML) de tranh Stored XSS: dia_chi_map va ten thon
      // la du lieu nguoi dung nhap, neu noi chuoi vao innerHTML se thuc thi script.
      const title = document.createElement("div");
      title.style.cssText = "font-weight:700;font-size:14px;margin-bottom:4px;color:#1a2333";
      title.textContent = hoSo.so_bien_ban;
      popupHtml.appendChild(title);

      const addRow = (label: string, value: string) => {
        const row = document.createElement("div");
        const b = document.createElement("span");
        b.style.color = "#667085";
        b.textContent = `${label} `;
        row.appendChild(b);
        row.appendChild(document.createTextNode(value));
        popupHtml.appendChild(row);
      };
      addRow("Thôn:", thonTen);
      addRow("Địa chỉ:", hoSo.dia_chi_map ?? "(chưa có)");
      addRow("Ngày lập:", new Date(hoSo.ngay_lap).toLocaleDateString("vi-VN"));
      addRow("Trạng thái:", TRANG_THAI_TEXT[hoSo.trang_thai_xu_ly]);
      addRow("Số tiền phạt:", `${hoSo.so_tien_phat.toLocaleString("vi-VN")} VNĐ`);

      const btn = document.createElement("button");
      btn.textContent = "Mở hồ sơ gốc →";
      btn.style.cssText =
        "margin-top:10px;padding:6px 14px;cursor:pointer;background:#2f7de1;color:#fff;border:none;border-radius:6px;font-size:12.5px;font-weight:600;font-family:inherit";
      btn.onclick = () => navigate(`/ho-so/${hoSo.id}`);
      popupHtml.appendChild(btn);

      marker.bindPopup(popupHtml);
      layer.addLayer(marker);
    });
  }, [hoSoList, thonMap, navigate]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%", minHeight: 500 }} />;
}
