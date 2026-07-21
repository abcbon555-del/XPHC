// Tim kiem dia danh (xa/phuong/dia diem) -> toa do, qua Nominatim (OpenStreetMap).
// Mien phi, khong can API key - cung nguon voi reverseGeocode trong LocationPicker.
// Gioi han ket qua trong Viet Nam (countrycodes=vn).

export interface DiaDiem {
  ten: string;
  lat: number;
  lng: number;
}

export async function timKiemDiaDiem(query: string): Promise<DiaDiem[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const url =
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}` +
    `&format=jsonv2&limit=6&accept-language=vi&countrycodes=vn`;
  try {
    const res = await fetch(url, { headers: { "Accept-Language": "vi" } });
    if (!res.ok) return [];
    const data = (await res.json()) as Array<{ display_name: string; lat: string; lon: string }>;
    return data.map((d) => ({ ten: d.display_name, lat: parseFloat(d.lat), lng: parseFloat(d.lon) }));
  } catch {
    return [];
  }
}
