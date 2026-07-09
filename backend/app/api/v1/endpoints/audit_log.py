from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin
from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.schemas.audit_log import AuditLogOut

router = APIRouter(prefix="/audit-log", tags=["audit-log"], dependencies=[Depends(require_admin)])


@router.get("", response_model=list[AuditLogOut])
async def list_audit_log(
    db: AsyncSession = Depends(get_db),
    tu_ngay: datetime | None = None,
    den_ngay: datetime | None = None,
    limit: int = 200,
):
    """Chi doc (read-only). Bang audit_log khong co endpoint sua/xoa - duoc bao ve o tang DB."""
    stmt = select(AuditLog)
    if tu_ngay is not None:
        stmt = stmt.where(AuditLog.thoi_gian >= tu_ngay)
    if den_ngay is not None:
        stmt = stmt.where(AuditLog.thoi_gian <= den_ngay)
    result = await db.execute(stmt.order_by(AuditLog.thoi_gian.desc()).limit(min(limit, 1000)))
    return result.scalars().all()
