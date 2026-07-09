-- Chay tu dong khi container Postgres khoi tao lan dau (docker-entrypoint-initdb.d).
-- Tao role rieng cho ung dung ket noi runtime - KHONG duoc la owner cua database/bang.
-- Xem giai thich chi tiet trong backend/README.md muc "Luu y bao mat audit_log".
CREATE ROLE xphc_app_role LOGIN PASSWORD 'change_me';
GRANT CONNECT ON DATABASE xphc_db TO xphc_app_role;
