from datetime import datetime, timezone

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def generate_so_bien_ban(db: AsyncSession, nam: int | None = None) -> str:
    """Sinh so bien ban dang 'BB-KTHT 001/2026', tang dan tuan tu theo nam.

    Dung INSERT ... ON CONFLICT ... RETURNING de dam bao tang atomic: bien ban
    nao duoc commit truoc se nhan so nho hon (thu tu lap bien ban).
    Bo dem reset ve 1 khi sang nam moi (moi nam co 1 dong rieng trong bang counter).
    """
    year = nam or datetime.now(timezone.utc).year
    result = await db.execute(
        text(
            """
            INSERT INTO bien_ban_counter (nam, so_hien_tai)
            VALUES (:nam, 1)
            ON CONFLICT (nam) DO UPDATE SET so_hien_tai = bien_ban_counter.so_hien_tai + 1
            RETURNING so_hien_tai
            """
        ),
        {"nam": year},
    )
    so = result.scalar_one()
    return f"BB-KTHT {so:03d}/{year}"
