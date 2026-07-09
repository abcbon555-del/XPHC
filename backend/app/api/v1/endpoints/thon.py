import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, require_admin
from app.db.session import get_db
from app.models.ho_so import HoSoViPham
from app.models.thon import Thon
from app.schemas.thon import ThonCreate, ThonOut, ThonUpdate

router = APIRouter(prefix="/thon", tags=["thon"])


@router.get("", response_model=list[ThonOut])
async def list_thon(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Thon).order_by(Thon.ten_thon))
    return result.scalars().all()


@router.post("", response_model=ThonOut, status_code=status.HTTP_201_CREATED)
async def create_thon(
    payload: ThonCreate, db: AsyncSession = Depends(get_db), _admin=Depends(require_admin)
):
    existing = await db.execute(select(Thon).where(Thon.ma_thon == payload.ma_thon))
    if existing.scalar_one_or_none():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Mã thôn đã tồn tại")
    thon = Thon(**payload.model_dump())
    db.add(thon)
    await db.commit()
    await db.refresh(thon)
    return thon


@router.put("/{thon_id}", response_model=ThonOut)
async def update_thon(
    thon_id: uuid.UUID,
    payload: ThonUpdate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    thon = await db.get(Thon, thon_id)
    if thon is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Không tìm thấy thôn")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(thon, field, value)
    await db.commit()
    await db.refresh(thon)
    return thon


@router.delete("/{thon_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_thon(
    thon_id: uuid.UUID, db: AsyncSession = Depends(get_db), _admin=Depends(require_admin)
):
    """Xoa mem: chuyen trang_thai = ngung_hoat_dong. Khong xoa cung neu con ho so tham chieu."""
    thon = await db.get(Thon, thon_id)
    if thon is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Không tìm thấy thôn")

    has_ho_so = (
        await db.execute(select(HoSoViPham.id).where(HoSoViPham.thon_id == thon_id).limit(1))
    ).scalar_one_or_none()
    if has_ho_so is not None:
        thon.trang_thai = "ngung_hoat_dong"
        await db.commit()
        return
    await db.delete(thon)
    await db.commit()
