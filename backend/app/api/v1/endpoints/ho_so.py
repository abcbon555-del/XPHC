import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, apply_view_scope_filter, require_nhap_lieu
from app.db.session import get_db
from app.models.ho_so import HoSoViPham
from app.schemas.ho_so import HoSoCreate, HoSoOut, HoSoSyncItem, HoSoUpdate
from app.services.so_bien_ban_service import generate_so_bien_ban

router = APIRouter(prefix="/ho-so", tags=["ho-so"])


@router.get("", response_model=list[HoSoOut])
async def list_ho_so(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    thon_id: uuid.UUID | None = None,
    linh_vuc_id: uuid.UUID | None = None,
    trang_thai_xu_ly: str | None = None,
    tu_ngay: datetime | None = None,
    den_ngay: datetime | None = None,
):
    """Danh sach ho so - dung cho ca trang danh sach va ban do so (pin theo toa do)."""
    stmt = select(HoSoViPham)

    scope_thon_id, scope_nguoi_lap_id = apply_view_scope_filter(current_user)
    if scope_thon_id is not None:
        stmt = stmt.where(HoSoViPham.thon_id == scope_thon_id)
    elif scope_nguoi_lap_id is not None and scope_thon_id is None and not current_user.thon_phu_trach_id:
        # Xem gioi han nhung khong duoc gan thon phu trach -> chi xem ho so tu lap
        stmt = stmt.where(HoSoViPham.nguoi_lap_id == scope_nguoi_lap_id)

    if thon_id is not None:
        stmt = stmt.where(HoSoViPham.thon_id == thon_id)
    if linh_vuc_id is not None:
        stmt = stmt.where(HoSoViPham.linh_vuc_id == linh_vuc_id)
    if trang_thai_xu_ly is not None:
        stmt = stmt.where(HoSoViPham.trang_thai_xu_ly == trang_thai_xu_ly)
    if tu_ngay is not None:
        stmt = stmt.where(HoSoViPham.ngay_lap >= tu_ngay)
    if den_ngay is not None:
        stmt = stmt.where(HoSoViPham.ngay_lap <= den_ngay)

    result = await db.execute(stmt.order_by(HoSoViPham.ngay_lap.desc()))
    return result.scalars().all()


@router.get("/{ho_so_id}", response_model=HoSoOut)
async def get_ho_so(ho_so_id: uuid.UUID, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    ho_so = await db.get(HoSoViPham, ho_so_id)
    if ho_so is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Không tìm thấy hồ sơ")
    return ho_so


@router.post("", response_model=HoSoOut, status_code=status.HTTP_201_CREATED)
async def create_ho_so(
    payload: HoSoCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_nhap_lieu),
):
    so_bien_ban = await generate_so_bien_ban(db)
    ho_so = HoSoViPham(**payload.model_dump(), so_bien_ban=so_bien_ban, nguoi_lap_id=current_user.id)
    db.add(ho_so)
    await db.commit()
    await db.refresh(ho_so)
    return ho_so


@router.put("/{ho_so_id}", response_model=HoSoOut)
async def update_ho_so(
    ho_so_id: uuid.UUID,
    payload: HoSoUpdate,
    db: AsyncSession = Depends(get_db),
    _perm=Depends(require_nhap_lieu),
):
    ho_so = await db.get(HoSoViPham, ho_so_id)
    if ho_so is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Không tìm thấy hồ sơ")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(ho_so, field, value)
    await db.commit()
    await db.refresh(ho_so)
    return ho_so


@router.post("/sync", response_model=list[HoSoOut])
async def sync_ho_so(
    items: list[HoSoSyncItem],
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_nhap_lieu),
):
    """Dong bo hang loat tu Mobile (Offline mode). Idempotent theo client_uuid:
    neu client_uuid da ton tai thi bo qua (khong tao trung), neu chua co thi INSERT.
    """
    if not items:
        return []

    client_uuids = [item.client_uuid for item in items]
    existing_result = await db.execute(
        select(HoSoViPham.client_uuid).where(HoSoViPham.client_uuid.in_(client_uuids))
    )
    existing_uuids = {row[0] for row in existing_result.all()}

    # Bien ban lap truoc (ngay_lap som hon) phai nhan so truoc, du dong bo theo thu tu nao.
    pending_items = sorted(
        (item for item in items if item.client_uuid not in existing_uuids),
        key=lambda item: item.ngay_lap,
    )

    new_records = []
    for item in pending_items:
        so_bien_ban = await generate_so_bien_ban(db, nam=item.ngay_lap.year)
        ho_so = HoSoViPham(**item.model_dump(), so_bien_ban=so_bien_ban, nguoi_lap_id=current_user.id)
        db.add(ho_so)
        new_records.append(ho_so)

    await db.commit()
    for record in new_records:
        await db.refresh(record)

    result = await db.execute(select(HoSoViPham).where(HoSoViPham.client_uuid.in_(client_uuids)))
    return result.scalars().all()
