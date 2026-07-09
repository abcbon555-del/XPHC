from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, require_admin
from app.db.session import get_db
from app.models.hanh_vi import HanhViViPham
from app.models.linh_vuc import LinhVucViPham
from app.schemas.danh_muc import HanhViCreate, HanhViOut, LinhVucOut

router = APIRouter(tags=["danh-muc"])


@router.get("/linh-vuc", response_model=list[LinhVucOut])
async def list_linh_vuc(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(LinhVucViPham)
        .where(LinhVucViPham.trang_thai == "hoat_dong")
        .order_by(LinhVucViPham.thu_tu_hien_thi)
    )
    return result.scalars().all()


@router.get("/hanh-vi", response_model=list[HanhViOut])
async def list_hanh_vi(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(HanhViViPham).where(HanhViViPham.trang_thai == "hoat_dong"))
    return result.scalars().all()


@router.post("/hanh-vi", response_model=HanhViOut, dependencies=[Depends(require_admin)])
async def create_hanh_vi(payload: HanhViCreate, db: AsyncSession = Depends(get_db)):
    hanh_vi = HanhViViPham(**payload.model_dump())
    db.add(hanh_vi)
    await db.commit()
    await db.refresh(hanh_vi)
    return hanh_vi
