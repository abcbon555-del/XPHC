#!/bin/sh
# Chay tu dong khi container Postgres khoi tao lan dau (docker-entrypoint-initdb.d).
# Tao role runtime xphc_app_role voi mat khau lay tu bien moi truong APP_DB_PASSWORD.
# Role nay KHONG duoc la owner cua database/bang - de bao ve audit_log append-only.
# Xem giai thich: backend/README.md muc "Luu y bao mat audit_log".
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
	CREATE ROLE xphc_app_role LOGIN PASSWORD '${APP_DB_PASSWORD}';
	GRANT CONNECT ON DATABASE xphc_db TO xphc_app_role;
EOSQL

echo "Da tao role xphc_app_role."
