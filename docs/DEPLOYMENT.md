# Hướng dẫn triển khai PRODUCTION (VPS)

Tài liệu này hướng dẫn đưa ứng dụng XPHC lên một máy chủ VPS (khuyến nghị đặt tại
Việt Nam vì dữ liệu công dân), chạy hoàn toàn bằng Docker với HTTPS tự động.

**Kiến trúc:** Caddy (HTTPS + phục vụ giao diện + reverse-proxy `/api`) → backend
FastAPI → PostgreSQL. File đính kèm lưu trên volume bền vững, có sao lưu DB định kỳ.

---

## 0. Chuẩn bị (làm một lần)

- [ ] **VPS** Ubuntu 22.04+ (RAM ≥ 2GB), có IP tĩnh.
- [ ] **Tên miền** trỏ bản ghi A về IP của VPS (ví dụ `xphc.diaphuong.gov.vn`).
- [ ] **Mở cổng** 80 và 443 trên tường lửa VPS.
- [ ] **Phê duyệt của cơ quan chủ quản** để đưa dữ liệu công dân lên mạng.

Cài Docker trên VPS:
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # đăng xuất/đăng nhập lại sau lệnh này
```

---

## 1. Lấy mã nguồn

```bash
git clone https://github.com/abcbon555-del/XPHC.git
cd XPHC
```

## 2. Tạo file cấu hình bí mật

```bash
cp .env.production.example .env.production
# Sinh SECRET_KEY ngẫu nhiên:
openssl rand -hex 32
```
Mở `.env.production` bằng `nano .env.production` và điền:
- `DOMAIN`, `TLS_EMAIL`
- `SECRET_KEY` (dán chuỗi vừa sinh)
- `POSTGRES_PASSWORD`, `APP_DB_PASSWORD` (hai mật khẩu mạnh, khác nhau)
- Phần white-label (tên xã, cơ quan, tọa độ bản đồ)

> ⚠️ **Không** commit `.env.production` lên GitHub (đã có trong `.gitignore`).

## 3. Khởi động toàn bộ hệ thống

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```
Lệnh này tự động: tạo PostgreSQL + role `xphc_app_role` (không phải owner) → chạy
migration bằng role `postgres` → cấp quyền → khởi động backend → Caddy cấp HTTPS.

Kiểm tra:
```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
curl -k https://$DOMAIN/health     # mong: {"status":"ok","database":"ok"}
```

## 4. Tạo tài khoản Quản trị viên đầu tiên

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml \
  exec backend python scripts/create_admin.py \
  --username admin --password 'MAT_KHAU_MANH' --hoten "Chủ tịch xã"
```

Xong! Mở trình duyệt: `https://<tên-miền-của-bạn>` và đăng nhập.

---

## 5. Cập nhật khi có phiên bản mới

```bash
cd XPHC
git pull
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```
Migration mới (nếu có) tự chạy. File đính kèm và database **không bị mất** (nằm trên volume).

## 6. Sao lưu database tự động (bắt buộc với dữ liệu công dân)

Chạy thử:
```bash
sh scripts/backup-db.sh          # tạo backups/xphc_db_<thời-gian>.sql.gz
```
Tự động hằng ngày lúc 2h sáng — thêm vào crontab (`crontab -e`):
```
0 2 * * * cd /home/$USER/XPHC && sh scripts/backup-db.sh >> backups/backup.log 2>&1
```
**Phục hồi** từ một bản sao lưu:
```bash
gunzip -c backups/xphc_db_XXXX.sql.gz | \
  docker compose --env-file .env.production -f docker-compose.prod.yml \
  exec -T db psql -U postgres -d xphc_db
```
> Khuyến nghị: sao chép thư mục `backups/` sang một nơi khác (ổ cứng ngoài / máy chủ khác) định kỳ.

## 7. Xem log / xử lý sự cố

```bash
# Log tất cả dịch vụ
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f
# Log riêng backend / caddy
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f backend
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f web
```
- **HTTPS chưa cấp được:** kiểm tra DNS đã trỏ đúng IP chưa, cổng 80/443 đã mở chưa (Caddy cần cổng 80 để xác thực Let's Encrypt).
- **Backend không khởi động:** thường do `SECRET_KEY` còn để mặc định (validator sẽ chặn) — kiểm tra `.env.production`.

---

## Ghi chú bảo mật đã áp dụng

- File đính kèm (ảnh vi phạm, CCCD) **chỉ tải được khi đã đăng nhập** (không còn URL public).
- HTTPS bắt buộc; header bảo mật (HSTS, nosniff, X-Frame-Options) tự bật ở production.
- `SECRET_KEY` mặc định bị chặn ở production.
- Role `xphc_app_role` không phải owner DB → không thể sửa/xóa nhật ký `audit_log`.
- Database chỉ truy cập nội bộ (không mở cổng 5432 ra ngoài).

## Việc nên làm tiếp (nâng cao, không chặn khởi chạy)

- Rate-limit đăng nhập chuyển sang Redis (hiện lưu trong RAM, hợp 1 instance).
- Thu hồi refresh token (rotation) khi cần khóa phiên từ xa.
- Giám sát uptime (UptimeRobot / healthcheck ngoài).
