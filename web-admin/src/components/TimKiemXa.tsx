import { useEffect, useRef, useState } from "react";
import { Search, MapPin } from "lucide-react";
import { timKiemDiaDiem, type DiaDiem } from "../api/geocoding";

/**
 * O tim kiem xa/dia danh. Go ten (vi du "Yen Xuan, Ha Noi") -> chon ket qua ->
 * goi onChon(diaDiem) de ban do bay ve vi tri do.
 */
export function TimKiemXa({ onChon }: { onChon: (d: DiaDiem) => void }) {
  const [tuKhoa, setTuKhoa] = useState("");
  const [ketQua, setKetQua] = useState<DiaDiem[]>([]);
  const [dangTim, setDangTim] = useState(false);
  const [moDropdown, setMoDropdown] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<number | undefined>(undefined);

  // Debounce 500ms de khong goi Nominatim qua nhieu (gioi han ~1 req/giay)
  useEffect(() => {
    window.clearTimeout(debounceRef.current);
    if (tuKhoa.trim().length < 3) {
      setKetQua([]);
      return;
    }
    debounceRef.current = window.setTimeout(async () => {
      setDangTim(true);
      try {
        const kq = await timKiemDiaDiem(tuKhoa);
        setKetQua(kq);
        setMoDropdown(true);
      } finally {
        setDangTim(false);
      }
    }, 500);
    return () => window.clearTimeout(debounceRef.current);
  }, [tuKhoa]);

  // Dong dropdown khi bam ra ngoai
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setMoDropdown(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function chon(d: DiaDiem) {
    onChon(d);
    setTuKhoa(d.ten.split(",").slice(0, 2).join(",").trim());
    setMoDropdown(false);
  }

  return (
    <div ref={boxRef} style={{ position: "relative", flex: 1, minWidth: 240 }}>
      <div style={{ position: "relative" }}>
        <Search
          size={16}
          style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }}
        />
        <input
          className="input"
          style={{ width: "100%", paddingLeft: 36 }}
          placeholder="Tìm xã/địa điểm để bản đồ chỉ về, ví dụ: Yên Xuân, Hà Nội"
          value={tuKhoa}
          onChange={(e) => setTuKhoa(e.target.value)}
          onFocus={() => ketQua.length > 0 && setMoDropdown(true)}
        />
      </div>

      {moDropdown && (
        <div
          className="card"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 1000,
            maxHeight: 280,
            overflowY: "auto",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          {dangTim && <div className="text-muted" style={{ padding: "10px 14px", fontSize: 13 }}>Đang tìm...</div>}
          {!dangTim && ketQua.length === 0 && tuKhoa.trim().length >= 3 && (
            <div className="text-muted" style={{ padding: "10px 14px", fontSize: 13 }}>Không tìm thấy địa điểm phù hợp</div>
          )}
          {ketQua.map((d, i) => (
            <button
              key={i}
              type="button"
              onClick={() => chon(d)}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                width: "100%",
                textAlign: "left",
                background: "none",
                border: "none",
                borderBottom: i < ketQua.length - 1 ? "1px solid var(--color-border)" : "none",
                padding: "10px 14px",
                cursor: "pointer",
                fontSize: 13,
                color: "var(--color-text)",
              }}
            >
              <MapPin size={15} style={{ color: "var(--color-accent)", flexShrink: 0, marginTop: 1 }} />
              <span>{d.ten}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
