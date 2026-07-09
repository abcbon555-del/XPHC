# KIẾN TRÚC HỆ THỐNG QUẢN LÝ XỬ LÝ VI PHẠM HÀNH CHÍNH CẤP XÃ (XPHC)

## 1. Tổng quan

Hệ thống gồm 3 thành phần chính dùng chung 1 Backend API và 1 Database:

```
                        ┌─────────────────────────┐
                        │   PostgreSQL 15+ (PostGIS│
                        │   optional cho tọa độ)   │
                        └───────────▲─────────────┘
                                    │
                        ┌───────────┴─────────────┐
                        │   Backend API (FastAPI)  │
                        │   - REST JSON            │
                        │   - JWT Auth + RBAC       │
                        │   - File storage (local/S3)│
                        │   - Audit Log middleware  │
                        │   - Excel export service  │
                        └───────▲───────────▲───────┘
                                │           │
                    HTTPS/REST  │           │  HTTPS/REST
                ┌───────────────┘           └───────────────┐
       ┌────────┴─────────┐                       ┌─────────┴────────┐
       │   Web Admin       │                       │   Mobile App      │
       │   ReactJS + Vite  │                       │   Flutter (Android│
       │   Leaflet Map     │                       │   /iOS)           │
       │   (Lãnh đạo, VP)  │                       │   Offline-first    │
       └───────────────────┘                       │   flutter_map(OSM)│
                                                     └───────────────────┘
```

**Nguyên tắc thiết kế:**
- 1 nguồn sự thật (single source of truth) là Backend API + PostgreSQL. Cả Web và Mobile chỉ là client.
- Mobile phải hoạt động Offline-first: mọi thao tác lập biên bản đều ghi vào DB cục bộ (SQLite) trước, đồng bộ nền (background sync) khi có mạng.
- Mọi hành động ghi/sửa/xóa dữ liệu nghiệp vụ đều phải sinh 1 dòng Audit Log không thể sửa/xóa (append-only).
- Phân quyền theo từng người dùng (không chỉ theo vai trò cứng), thực thi tại tầng API (không tin tưởng client).

## 2. Công nghệ đề xuất (đã chốt)

| Thành phần | Công nghệ | Lý do |
|---|---|---|
| Backend | Python 3.11+ / FastAPI + SQLAlchemy 2.0 + Alembic | Async, tự sinh OpenAPI docs, mạnh về xử lý dữ liệu/GIS, dễ viết export Excel (openpyxl) |
| Database | PostgreSQL 15 (khuyến nghị bật extension `postgis` cho truy vấn không gian) | Lưu văn bản, tọa độ, JSON, hỗ trợ Row Level Security nếu cần |
| Web Admin | ReactJS + Vite + TypeScript + TanStack Query + Leaflet | Hệ sinh thái lớn, nhiều thư viện bản đồ/export Excel |
| Mobile App | Flutter (Dart) | 1 codebase Android/iOS, hiệu năng native, sqflite/drift cho offline |
| Bản đồ Mobile | flutter_map + OpenStreetMap/Esri World Imagery | Miễn phí, không cần API key/billing (đã đổi từ Google Maps SDK theo yêu cầu không phát sinh chi phí) |
| Auth | JWT (access + refresh token), bcrypt/argon2 hash mật khẩu | Stateless, dùng chung cho Web & Mobile |
| File Storage | Local disk (giai đoạn đầu) → có thể chuyển S3-compatible (MinIO) sau | Ảnh/video hiện trường, PDF quyết định, biên lai |
| Background Job | APScheduler / Celery (tùy tải) | Sinh báo cáo lớn, dọn file rác |

## 3. Vấn đề cần lưu ý ngay từ đầu (đã phát hiện khi thiết kế)

> ⚠️ **Vấn đề 1 — Bản đồ vệ tinh trên Web Admin:**
> Yêu cầu ghi "OpenStreetMap JavaScript API - Chế độ vệ tinh", nhưng bản thân dữ liệu OpenStreetMap là bản đồ vector/raster đường phố, **không có lớp ảnh vệ tinh**. Để có "chế độ vệ tinh" miễn phí đi kèm Leaflet, giải pháp thực tế là:
> - Lớp mặc định: OpenStreetMap (đường phố)
> - Lớp vệ tinh: **Esri World Imagery** (miễn phí, không cần API key) hoặc **Google Maps Satellite** (cần API key + billing, nhưng đồng bộ trải nghiệm với Mobile).
> Tôi đã chọn mặc định: Leaflet + toggle 2 lớp (OSM / Esri World Imagery) để không phát sinh chi phí. Nếu anh/chị muốn dùng Google Maps Satellite cho Web (đồng bộ y hệt Mobile), cho tôi biết để đổi cấu hình — code đã tách lớp bản đồ thành component riêng nên đổi rất nhanh.

> ✅ **Vấn đề 2 (đã xử lý) — Bản đồ & Reverse Geocoding trên Mobile, không phát sinh chi phí:**
> Yêu cầu ban đầu ghi Google Maps SDK, nhưng Google Maps SDK + Google Geocoding API đều cần tạo project trên Google
> Cloud Console và **bật billing** (có hạn mức miễn phí hàng tháng nhưng vẫn phải khai báo thẻ). Vì anh/chị yêu cầu
> dùng ứng dụng không phải trả phí, Mobile đã được đổi sang:
> - **Bản đồ**: `flutter_map` + tile OpenStreetMap (mặc định) / Esri World Imagery (chế độ vệ tinh) — đồng bộ đúng
>   lựa chọn với Web Admin, hoàn toàn miễn phí, không cần API key.
> - **Reverse Geocoding**: **Nominatim** (OpenStreetMap) — miễn phí, không cần key. Giới hạn ~1 request/giây (đủ
>   dùng cho quy mô 1 xã, vài chục biên bản/ngày) và bắt buộc gửi header `User-Agent` định danh app (đã cấu hình sẵn
>   trong `NominatimGeocodingService`).
> - **Kéo-thả ghim**: `flutter_map` không hỗ trợ marker kéo-thả như Google Maps, nên dùng pattern "ghim cố định giữa
>   màn hình, người dùng pan bản đồ để chỉnh vị trí" — trải nghiệm tương đương, phổ biến ở các app chọn vị trí miễn
>   phí không dùng Google.
> - Đánh đổi: không có tính năng chỉ đường, độ chi tiết ảnh vệ tinh ở một số khu vực có thể thấp hơn Google. Nếu sau
>   này cần nâng cấp, có thể chuyển lại Google Maps SDK mà không ảnh hưởng phần còn lại (interface đã tách riêng).

> ⚠️ **Vấn đề 4 — "Xóa" thôn/đối tượng:**
> Yêu cầu cho phép Admin "xóa thôn", nhưng nếu 1 thôn đã có hồ sơ vi phạm gắn vào thì xóa cứng (hard delete) sẽ làm mất liên kết dữ liệu lịch sử. Giải pháp: xóa mềm (soft delete qua cột `trang_thai` = 'ngung_hoat_dong'), chặn xóa cứng nếu còn hồ sơ tham chiếu. Áp dụng tương tự cho tài khoản nhân sự (vô hiệu hóa thay vì xóa cứng, để giữ lịch sử "người lập biên bản").

## 4. Luồng nghiệp vụ chính

### 4.1. Lập biên bản trên Mobile (Offline-first)
1. Cán bộ mở app → chọn "Lập biên bản mới".
2. Nhập thông tin đối tượng (tra cứu theo CCCD nếu đã tồn tại → tự điền, tăng số lần tái phạm).
3. Chọn Thôn, Lĩnh vực VPHC, Hành vi vi phạm (danh mục có sẵn, đồng bộ về máy khi có mạng).
4. Bản đồ: lấy GPS hiện tại → cho phép kéo-thả ghim chỉnh vị trí chính xác → reverse geocoding ra địa chỉ chữ.
5. Chụp ảnh/quay video hiện trường, đính kèm.
6. Bấm Lưu:
   - **Có mạng:** gọi API `POST /api/v1/ho-so` trực tiếp, kèm upload file.
   - **Mất mạng:** lưu vào SQLite cục bộ (bảng `ho_so_local`) với `sync_status = pending`, file ảnh lưu trong thư mục app riêng, kèm 1 `client_uuid` sinh trên máy (dùng làm khóa idempotent).
7. Background sync service theo dõi kết nối mạng (connectivity_plus), khi có mạng → lần lượt POST các bản ghi `pending` lên `/api/v1/ho-so/sync` (endpoint idempotent theo `client_uuid`), sau đó upload file kèm theo. Thành công → đánh dấu `synced` và xóa cache ảnh gốc (giữ lại thumbnail).

### 4.2. Quản lý trên Web Admin
1. Lãnh đạo đăng nhập → xem Dashboard bản đồ số (Leaflet), ghim màu theo trạng thái.
2. Click ghim → popup thông tin nhanh → "Mở hồ sơ gốc" → trang chi tiết hồ sơ với 3 nhóm tài liệu.
3. Cán bộ văn phòng cập nhật trạng thái xử lý, upload Quyết định xử phạt / Biên lai.
4. Xuất báo cáo Excel ma trận theo bộ lọc thời gian + thôn.

### 4.3. Audit Log
Mọi request ghi dữ liệu (POST/PUT/PATCH/DELETE) đi qua 1 middleware chung, tự động ghi:
`thoi_gian, tai_khoan_id, hanh_dong (method + endpoint), noi_dung_chi_tiet (diff hoặc payload rút gọn), ip_address`.
Bảng `audit_log` được bảo vệ ở tầng DB: user/role kết nối của ứng dụng chỉ có quyền `INSERT`, không có `UPDATE`/`DELETE` (xem chi tiết trong `database_schema.sql`).

## 5. Phân quyền (RBAC theo checkbox, không phải role cố định)

Mỗi tài khoản nhân sự có các cờ quyền độc lập (lưu trong bảng `nguoi_dung`):
- `quyen_nhap_lieu` (bool) — được lập biên bản trên App/Web.
- `quyen_upload_tai_lieu` (bool) — được tải lên Quyết định/Biên lai.
- `pham_vi_xem` (enum: `gioi_han` | `toan_bo`) — giới hạn: chỉ xem hồ sơ do mình lập hoặc thôn mình phụ trách (`thon_phu_trach_id`); toàn bộ: xem hết toàn xã.
- `quyen_xuat_bao_cao` (bool).
- Riêng tài khoản `is_admin = true` (Lãnh đạo xã) có toàn quyền + quyền quản lý tài khoản/thôn, không thể tự thu hồi quyền admin của chính mình qua UI (tránh khóa hệ thống).

Thực thi tại tầng API bằng FastAPI dependency `require_permission(...)`, không dựa vào việc ẩn/hiện nút trên giao diện (client không đáng tin).

## 6. Cấu trúc thư mục dự án

```
XPHC/
├── docs/
│   ├── ARCHITECTURE.md          (tài liệu này)
│   └── database_schema.sql      (DDL đầy đủ + trigger + comment)
├── backend/                      (FastAPI)
├── web-admin/                    (ReactJS + Vite + TS)
└── mobile-app/                   (Flutter)
```

## 7. Kế hoạch triển khai theo giai đoạn

1. **Giai đoạn 1 (nền tảng):** DB schema, Backend Auth + RBAC + CRUD Thôn/Đối tượng/Hồ sơ + Audit Log.
2. **Giai đoạn 2:** Web Admin — bản đồ số, quản lý hồ sơ, quản lý thôn, quản lý tài khoản.
3. **Giai đoạn 3:** Mobile App — lập biên bản, bản đồ + camera, offline sync.
4. **Giai đoạn 4:** Xuất báo cáo Excel ma trận, tối ưu, kiểm thử tải, đóng gói triển khai (Docker Compose).

Tài liệu này sẽ được cập nhật nếu phát sinh thay đổi quan trọng trong quá trình build.
