# Backend - XPHC API (FastAPI)

## Chạy nhanh với Docker

```bash
docker compose up --build
```

`docker-compose.yml` tự động: khởi tạo Postgres với `postgres` làm chủ sở hữu, tạo role runtime `xphc_app_role`
(không phải chủ sở hữu — đúng thiết kế bảo mật, xem mục dưới), chạy migration bằng role `postgres`, rồi cấp quyền
có kiểm soát cho `xphc_app_role` trước khi khởi động API. Không cần tạo file `.env` cho luồng Docker này (các biến
môi trường cần thiết đã khai trong `docker-compose.yml`).

API chạy tại `http://localhost:8000`, tài liệu Swagger tại `http://localhost:8000/docs`.

Tạo tài khoản Admin đầu tiên:

```bash
docker compose exec api python scripts/create_admin.py --username admin --password <mat_khau> --hoten "Chu tich xa"
```

## Chạy thủ công (dev, không dùng Docker)

Cần Python 3.11 hoặc 3.12 (Python 3.13/3.14 có thể chưa có wheel dựng sẵn cho `psycopg2`/`pydantic-core`
tại thời điểm viết tài liệu này — kiểm tra `py -0` để xem các bản đã cài).

```bash
py -3.12 -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
cp .env.example .env            # sua DATABASE_URL cho phu hop
```

Tạo database + role runtime (KHÔNG để `xphc_app_role` làm owner — xem lý do ở mục dưới):

```sql
CREATE ROLE xphc_app_role LOGIN PASSWORD 'change_me';
CREATE DATABASE xphc_db OWNER postgres;
GRANT CONNECT ON DATABASE xphc_db TO xphc_app_role;
```

Chạy migration **bằng role owner** (`postgres`), không phải `xphc_app_role`:

```bash
DATABASE_URL=postgresql+asyncpg://postgres:<mat_khau>@localhost:5432/xphc_db alembic upgrade head
```

Sau đó cấp quyền có kiểm soát cho `xphc_app_role` (role dùng để kết nối runtime, đã khai trong `.env`):

```sql
GRANT USAGE ON SCHEMA public TO xphc_app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO xphc_app_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO xphc_app_role;
REVOKE UPDATE, DELETE, TRUNCATE ON audit_log FROM xphc_app_role;
GRANT SELECT, INSERT ON audit_log TO xphc_app_role;
```

(Hoặc chạy nhanh bằng script có sẵn thay vì gõ tay: `DATABASE_URL=postgresql+asyncpg://postgres:<mat_khau>@localhost:5432/xphc_db python scripts/grant_app_role.py`)

Cuối cùng chạy app (dùng `DATABASE_URL` trong `.env`, đã trỏ tới `xphc_app_role`):

```bash
uvicorn app.main:app --reload
```

## Tạo tài khoản Admin đầu tiên

Chưa có endpoint đăng ký công khai (đúng chủ đích - tài khoản do Admin tạo). Tạo tài khoản Admin đầu tiên bằng script:

```bash
python scripts/create_admin.py --username admin --password <mat_khau> --hoten "Chu tich xa"
```

## Cấu trúc chính

- `app/models` — SQLAlchemy models khớp `docs/database_schema.sql`.
- `app/api/v1/endpoints` — các router REST.
- `app/api/deps.py` — xác thực JWT + kiểm tra quyền (RBAC theo checkbox).
- `app/middleware/audit_middleware.py` — tự động ghi `audit_log` cho mọi request ghi dữ liệu.
- `app/services/report_service.py` — sinh báo cáo Excel ma trận (Thôn x Lĩnh vực).
- `alembic/versions/0001_initial_schema.py` — migration khởi tạo toàn bộ schema, trigger, bảo vệ audit_log.

## Lưu ý bảo mật audit_log (đã kiểm chứng thực tế)

Bảng `audit_log` bị chặn UPDATE/DELETE/TRUNCATE ở tầng DB (REVOKE + trigger). Xem chi tiết trong migration
`0001_initial_schema.py` và `docs/database_schema.sql` mục 7.

**Quan trọng — đã test và xác nhận**: `xphc_app_role` (role dùng cho kết nối runtime của app) **tuyệt đối không
được là owner** của database/bảng. Trong PostgreSQL, owner của bảng luôn có toàn quyền trên bảng đó (kể cả
`ALTER TABLE ... DISABLE TRIGGER`), bất kể REVOKE gì áp dụng — nếu lỡ để `xphc_app_role` làm owner, nó có thể tự
tắt trigger bảo vệ rồi UPDATE/DELETE bình thường, vô hiệu hóa toàn bộ cơ chế append-only.

Quy trình đúng (xem lệnh cụ thể ở mục "Chạy thủ công" phía trên): chạy migration bằng role owner (`postgres`),
sau đó GRANT quyền có kiểm soát cho `xphc_app_role` — không GRANT ownership. Đã test trực tiếp bằng `psql` với
thiết lập này: `xphc_app_role` INSERT được vào `audit_log`, nhưng UPDATE/DELETE và cả việc tắt trigger đều bị
Postgres từ chối với lỗi `permission denied` / `must be owner of table`.
