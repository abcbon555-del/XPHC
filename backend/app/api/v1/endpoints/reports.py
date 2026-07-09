import uuid
from datetime import datetime

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_export
from app.db.session import get_db
from app.services.report_service import build_bao_cao_ma_tran

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/export")
async def export_bao_cao(
    tu_ngay: datetime,
    den_ngay: datetime,
    thon_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
    _perm=Depends(require_export),
):
    content = await build_bao_cao_ma_tran(db, tu_ngay, den_ngay, thon_id)
    filename = f"bao_cao_vphc_{tu_ngay.date()}_{den_ngay.date()}.xlsx"
    return StreamingResponse(
        iter([content]),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
