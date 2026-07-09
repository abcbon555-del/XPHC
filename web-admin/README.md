# Web Admin - XPHC (ReactJS + Vite + TypeScript)

## Chạy dev

```bash
npm install
cp .env.example .env      # sua VITE_API_BASE_URL neu backend chay port khac
npm run dev
```

Mặc định chạy ở `http://localhost:5173`, gọi API tại `http://localhost:8000/api/v1`.

## Ghi chú kỹ thuật quan trọng

- **Bản đồ (`src/components/MapView.tsx`)**: dùng Leaflet với 2 lớp — OpenStreetMap (mặc định) và **Esri World Imagery**
  làm lớp "vệ tinh" (Esri miễn phí, không cần API key). OpenStreetMap tự thân không có ảnh vệ tinh — xem giải thích
  trong [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) mục 3. Nếu muốn đổi sang Google Maps Satellite (đồng bộ
  với Mobile), thay tile layer trong `MapView.tsx` bằng Google Maps JavaScript API (`@react-google-maps/api`) — cần
  API key + billing.
- Ghim đổi màu theo `trang_thai_xu_ly`: Đỏ (`moi_phat_hien`), Vàng (`da_ra_quyet_dinh`), Xanh lá
  (`da_giai_quyet_dut_diem`).
- Phân quyền UI chỉ mang tính hỗ trợ hiển thị — quyền thật sự luôn được Backend kiểm tra lại (403 nếu không đủ quyền).
- `src/api/client.ts` tự động refresh access token khi hết hạn (401) bằng refresh token lưu trong `localStorage`.
