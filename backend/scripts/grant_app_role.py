"""Cap quyen co kiem soat cho xphc_app_role sau khi alembic da tao xong schema.

BAT BUOC chay bang role owner (postgres), KHONG phai xphc_app_role - neu de
xphc_app_role la owner, no co the tu tat trigger bao ve audit_log. Xem
backend/README.md muc "Luu y bao mat audit_log".

Chay: DATABASE_URL=postgresql+asyncpg://postgres:<mat_khau>@host:5432/xphc_db \
      python scripts/grant_app_role.py
"""
import os

import psycopg2

GRANT_STATEMENTS = [
    "GRANT USAGE ON SCHEMA public TO xphc_app_role",
    "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO xphc_app_role",
    "GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO xphc_app_role",
    "REVOKE UPDATE, DELETE, TRUNCATE ON audit_log FROM xphc_app_role",
    "GRANT SELECT, INSERT ON audit_log TO xphc_app_role",
]


def main() -> None:
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        raise SystemExit("Can bien moi truong DATABASE_URL (ket noi bang role owner, vd postgres)")

    sync_url = database_url.replace("postgresql+asyncpg://", "postgresql://")
    conn = psycopg2.connect(sync_url)
    conn.autocommit = True
    try:
        with conn.cursor() as cur:
            for stmt in GRANT_STATEMENTS:
                print(f"-> {stmt}")
                cur.execute(stmt)
        print("Da cap quyen xong cho xphc_app_role.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
