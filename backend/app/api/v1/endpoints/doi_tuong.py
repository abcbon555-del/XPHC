import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, require_nhap_lieu
from app.db.session import get_db
from app.models.doi_tuong import DoiTuongViPham
from app.schemas.doi_tuong import DoiTuongCreate, DoiTuongOut, DoiTuongUpdate

router = APIRouter(prefix="/doi-tuong", tags=["doi-tuong"])


@router.get("", response_model=list[DoiTuongOut])
async def search_doi_tuong(
    current_user: CurrentUser,
    q: str | None = Query(None, description="Tim theo ho ten, so CCCD hoac so dien thoai"),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(DoiTuongViPham)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            or_(
                DoiTuongViPham.ho_ten.ilike(like),
                DoiTuongViPham.so_cccd.ilike(like),
                DoiTuongViPham.so_dt.ilike(like),
            )
        )
    result = await db.execute(stmt.order_by(DoiTuongViPham.ho_ten).limit(50))
    return result.scalars().all()


@router.get("/{doi_tuong_id}", response_model=DoiTuongOut)
async def get_doi_tuong(
    doi_tuong_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    doi_tuong = await db.get(DoiTuongViPham, doi_tuong_id)
    if doi_tuong is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Không tìm thấy đối tượng vi phạm")
    return doi_tuong


@router.post("", response_model=DoiTuongOut, status_code=status.HTTP_201_CREATED)
async def create_doi_tuong(
    payload: DoiTuongCreate,
    db: AsyncSession = Depends(get_db),
    _perm=Depends(require_nhap_lieu),
):
    if payload.so_cccd:
        existing = await db.execute(
            select(DoiTuongViPham).where(DoiTuongViPham.so_cccd == payload.so_cccd)
        )
        found = existing.scalar_one_or_none()
        if found:
            return found  # tra ve doi tuong da co de tang so lan tai pham khi lap ho so moi

    doi_tuong = DoiTuongViPham(**payload.model_dump())
    db.add(doi_tuong)
    await db.commit()
    await db.refresh(doi_tuong)
    return doi_tuong


@router.put("/{doi_tuong_id}", response_model=DoiTuongOut)
async def update_doi_tuong(
    doi_tuong_id: uuid.UUID,
    payload: DoiTuongUpdate,
    db: AsyncSession = Depends(get_db),
    _perm=Depends(require_nhap_lieu),
):
    doi_tuong = await db.get(DoiTuongViPham, doi_tuong_id)
    if doi_tuong is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Không tìm thấy đối tượng vi phạm")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(doi_tuong, field, value)
    await db.commit()
    await db.refresh(doi_tuong)
    return doi_tuong
