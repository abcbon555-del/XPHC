import L from "leaflet";
import { useEffect, useRef, useState } from "react";
import { LocateFixed } from "lucide-react";
import { useConfig } from "../context/ConfigContext";

interface Props {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}

/// Ban do chon vi tri: click/keo ghim de chon toa do vi pham.
/// Dung Leaflet + OpenStreetMap (mien phi, khong can API key) - dong bo voi
/// MapView.tsx va voi cach chon vi tri tren Mobile.
export function LocationPicker({ lat, lng, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [dangLayViTri, setDangLayViTri] = useState(false);
  const config = useConfig();

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center: [number, number] =
      lat != null && lng != null ? [lat, lng] : [config.ban_do_vi_do_mac_dinh, config.ban_do_kinh_do_mac_dinh];
    const map = L.map(containerRef.current, { center, zoom: 15 });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const marker = L.marker(center, { draggable: true }).addTo(map);
    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      onChangeRef.current(pos.lat, pos.lng);
    });
    map.on("click", (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      onChangeRef.current(e.latlng.lat, e.latlng.lng);
    });

    markerRef.current = marker;
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lng]);

  function dungViTriHienTai() {
    if (!navigator.geolocation) return;
    setDangLayViTri(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        onChangeRef.current(latitude, longitude);
        markerRef.current?.setLatLng([latitude, longitude]);
        mapRef.current?.setView([latitude, longitude], 17);
        setDangLayViTri(false);
      },
      () => setDangLayViTri(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <div ref={containerRef} style={{ width: "100%", height: 280, borderRadius: "var(--radius-sm)", overflow: "hidden" }} />
      <button
        type="button"
        onClick={dungViTriHienTai}
        className="btn btn-secondary btn-sm"
        style={{ position: "absolute", top: 10, right: 10, zIndex: 1000 }}
        disabled={dangLayViTri}
      >
        <LocateFixed size={14} /> {dangLayViTri ? "Đang định vị..." : "Vị trí của tôi"}
      </button>
    </div>
  );
}

/// Reverse geocoding mien phi qua Nominatim (OpenStreetMap) - dong bo voi
/// NominatimGeocodingService tren Mobile. Luon tra ve 1 chuoi, khong throw.
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2&accept-language=vi`,
      { headers: { "Accept-Language": "vi" } }
    );
    const data = await response.json();
    return data.display_name ?? `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
}
