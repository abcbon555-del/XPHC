# XPHC — Hệ thống quản lý xử lý vi phạm hành chính, trật tự xây dựng, đất đai cấp xã

Xem tài liệu kiến trúc đầy đủ tại [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) và schema database tại
[`docs/database_schema.sql`](docs/database_schema.sql).

## Thành phần

| Thư mục | Công nghệ | Mô tả |
|---|---|---|
| [`backend/`](backend/README.md) | Python + FastAPI + PostgreSQL | REST API, RBAC theo checkbox, audit log append-only, xuất báo cáo Excel |
| [`web-admin/`](web-admin/README.md) | ReactJS + Vite + TypeScript + Leaflet | Bản đồ số, quản lý hồ sơ/thôn/tài khoản, xuất Excel |
| [`mobile-app/`](mobile-app/README.md) | Flutter | Lập biên bản, flutter_map (OSM/Esri, miễn phí), offline-first + đồng bộ nền |

## Chạy nhanh (dev)

### Cách 1 — Toàn bộ backend bằng Docker (đơn giản nhất)

```bash
cd backend
docker compose up --build   # tu dong: tao DB, tao role rieng cho app, chay migration, cap quyen, khoi dong API
```

Compose sẽ tự tạo role `xphc_app_role` **không phải chủ sở hữu database** (đúng thiết kế bảo mật audit log —
xem `backend/README.md` mục "Lưu ý bảo mật audit_log"), chạy migration bằng role `postgres`, rồi cấp quyền có
kiểm soát cho `xphc_app_role`. API chạy tại `http://localhost:8000`.

Tạo tài khoản Admin đầu tiên (container `api` đang chạy):

```bash
docker compose exec api python scripts/create_admin.py --username admin --password <mat_khau> --hoten "Chu tich xa"
```

### Cách 2 — Backend chạy thủ công (không Docker), chỉ dùng Docker cho Postgres

```bash
cd backend
cp .env.example .env
docker compose up --build -d db          # chi chay Postgres truoc (da co san xphc_app_role, khong phai owner)
py -3.12 -m venv venv && venv\Scripts\activate
pip install -r requirements.txt
# Chay migration bang role owner (postgres), KHONG phai xphc_app_role - xem backend/README.md
DATABASE_URL=postgresql+asyncpg://postgres:change_me_postgres@localhost:5432/xphc_db alembic upgrade head
DATABASE_URL=postgresql+asyncpg://postgres:change_me_postgres@localhost:5432/xphc_db python scripts/grant_app_role.py
python scripts/create_admin.py --username admin --password <mat_khau> --hoten "Chu tich xa"
uvicorn app.main:app --reload
```

### Web Admin

```bash
cd web-admin
npm install
cp .env.example .env
npm run dev                          # http://localhost:5173
```

### Mobile App

```bash
cd mobile-app
flutter create . --org com.xphc --project-name xphc_mobile   # sinh phan native con thieu
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8000/api/v1   # khong can API key nao
```

## Trạng thái đã build & kiểm thử trong quá trình scaffold

- ✅ Backend: toàn bộ file Python đã qua kiểm tra cú pháp (`ast.parse`). **Chưa cài đặt/chạy thử đầy đủ dependencies**
  trong môi trường build này vì máy tự động cài Python 3.14 (quá mới, `psycopg2`/`pydantic-core` chưa có wheel dựng
  sẵn) — khuyến nghị chạy bằng Docker (`Dockerfile` đã ghim `python:3.11-slim`) hoặc cài Python 3.11/3.12 thật khi
  phát triển.
- ✅ Web Admin: `npm install`, `tsc -b` (type-check) và `npm run build` (Vite production build) đều chạy thành công.
- ✅ Mobile App: scaffold đầy đủ, đối chiếu thủ công cấu trúc payload đồng bộ (`toSyncPayload()`) khớp chính xác với
  schema `HoSoSyncItem` của backend. Chưa build thật vì môi trường không có Flutter SDK — cần `flutter pub get` và
  `flutter create .` (sinh phần native) trước khi chạy.

## Vấn đề đã phát hiện & hướng xử lý (xem chi tiết trong `docs/ARCHITECTURE.md` mục 3)

1. **Bản đồ (Web Admin + Mobile)**: theo yêu cầu không phát sinh chi phí, toàn bộ hệ thống dùng giải pháp bản đồ
   **miễn phí, không cần API key/billing**: OpenStreetMap + Esri World Imagery (lớp "vệ tinh") cho Web Admin (Leaflet)
   và Mobile (flutter_map). Không dùng Google Maps SDK.
2. **Reverse Geocoding Mobile**: dùng **Nominatim** (OpenStreetMap, miễn phí, không cần key) thay vì Google Geocoding
   API. Giới hạn ~1 request/giây — đủ dùng cho quy mô 1 xã. Có fallback mock khi mất mạng/vượt rate limit.
3. **Xóa Thôn/Tài khoản**: đổi thành vô hiệu hóa (soft delete) nếu còn hồ sơ tham chiếu, tránh mất liên kết dữ liệu
   lịch sử.

## Việc còn lại trước khi lên production

- Cấu hình `xphc_app_role` (role DB riêng cho ứng dụng runtime, không dùng superuser) và REVOKE quyền sửa/xóa trên
  `audit_log` cho role đó — xem hướng dẫn trong `docs/database_schema.sql` mục 7.
- Thay file storage local bằng S3/MinIO nếu triển khai nhiều instance backend (storage_service.py đã tách lớp sẵn).
- Nếu sau này cần trải nghiệm bản đồ tốt hơn (chỉ đường, độ chi tiết vệ tinh cao hơn), có thể đổi sang Google Maps
  SDK — code đã tách interface `GeocodingService` và widget bản đồ riêng nên đổi không ảnh hưởng phần còn lại.
- Viết test tự động (chưa có trong phạm vi scaffold ban đầu này).
