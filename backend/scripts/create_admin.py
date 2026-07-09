"""Script tao tai khoan Admin (Lanh dao xa) dau tien.

Chay: python scripts/create_admin.py --username admin --password ... --hoten "Chu tich xa"
"""
import argparse
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import AsyncSessionLocal
from app.models.nguoi_dung import NguoiDung


async def main(username: str, password: str, ho_ten: str) -> None:
    async with AsyncSessionLocal() as session:
        existing = await session.execute(select(NguoiDung).where(NguoiDung.ten_dang_nhap == username))
        if existing.scalar_one_or_none():
            print(f"Tai khoan '{username}' da ton tai.")
            return

        admin = NguoiDung(
            ten_dang_nhap=username,
            mat_khau_hash=hash_password(password),
            ho_ten=ho_ten,
            is_admin=True,
            is_active=True,
            quyen_nhap_lieu=True,
            quyen_upload_tai_lieu=True,
            pham_vi_xem="toan_bo",
            quyen_xuat_bao_cao=True,
        )
        session.add(admin)
        await session.commit()
        print(f"Da tao tai khoan Admin '{username}'.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--username", required=True)
    parser.add_argument("--password", required=True)
    parser.add_argument("--hoten", required=True)
    args = parser.parse_args()
    asyncio.run(main(args.username, args.password, args.hoten))
