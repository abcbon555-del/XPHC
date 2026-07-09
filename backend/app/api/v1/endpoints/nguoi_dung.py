import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin
from app.core.security import hash_password
from app.db.session import get_db
from app.models.nguoi_dung import NguoiDung
from app.schemas.nguoi_dung import NguoiDungCreate, NguoiDungOut, NguoiDungUpdate
from app.services.storage_service import delete_stored_file, save_avatar_file

router = APIRouter(prefix="/nguoi-dung", tags=["nguoi-dung"], dependencies=[Depends(require_admin)])


@router.get("", response_model=list[NguoiDungOut])
async def list_nguoi_dung(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(NguoiDung).order_by(NguoiDung.ho_ten))
    return result.scalars().all()


@router.post("", response_model=NguoiDungOut, status_code=status.HTTP_201_CREATED)
async def create_nguoi_dung(payload: NguoiDungCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(NguoiDung).where(NguoiDung.ten_dang_nhap == payload.ten_dang_nhap))
    if existing.scalar_one_or_none():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Tên đăng nhập đã tồn tại")

    data = payload.model_dump(exclude={"mat_khau"})
    user = NguoiDung(**data, mat_khau_hash=hash_password(payload.mat_khau))
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.put("/{user_id}", response_model=NguoiDungOut)
async def update_nguoi_dung(
    user_id: uuid.UUID, payload: NguoiDungUpdate, db: AsyncSession = Depends(get_db)
):
    user = await db.get(NguoiDung, user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Không tìm thấy tài khoản")

    data = payload.model_dump(exclude_unset=True, exclude={"mat_khau"})
    for field, value in data.items():
        setattr(user, field, value)
    if payload.mat_khau:
        user.mat_khau_hash = hash_password(payload.mat_khau)

    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_nguoi_dung(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Vô hiệu hóa tài khoản (không xóa cứng) để giữ lịch sử 'người lập hồ sơ'."""
    user = await db.get(NguoiDung, user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Không tìm thấy tài khoản")
    if user.is_admin:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Không thể vô hiệu hóa tài khoản Quản trị viên")
    user.is_active = False
    await db.commit()


@router.delete("/{user_id}/vinh-vien", status_code=status.HTTP_204_NO_CONTENT)
async def xoa_vinh_vien_nguoi_dung(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Xoa cung tai khoan da nhap nham/khong con dung. Chi thanh cong neu tai khoan
    chua tung co hoat dong nao duoc ghi lai (chua lap ho so, chua upload file, chua co
    nhat ky he thong) - neu da co, tra ve 409 va nguoi dung nen dung Vo hieu hoa thay the,
    vi day la co che bao ve tinh toan ven cua nhat ky he thong (audit_log)."""
    user = await db.get(NguoiDung, user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Không tìm thấy tài khoản")
    if user.is_admin:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Không thể xóa tài khoản Quản trị viên")

    await db.delete(user)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail=(
                "Không thể xóa vĩnh viễn: tài khoản đã có lịch sử hoạt động trong hệ thống "
                "(lập hồ sơ, tải tệp, hoặc nhật ký hệ thống). Vui lòng dùng chức năng Vô hiệu hóa thay thế."
            ),
        )


@router.post("/{user_id}/avatar", response_model=NguoiDungOut)
async def upload_avatar(user_id: uuid.UUID, file: UploadFile, db: AsyncSession = Depends(get_db)):
    user = await db.get(NguoiDung, user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Không tìm thấy tài khoản")

    if user.anh_dai_dien:
        delete_stored_file(user.anh_dai_dien)

    user.anh_dai_dien = await save_avatar_file(user_id, file)
    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/{user_id}/avatar", response_model=NguoiDungOut)
async def delete_avatar(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    user = await db.get(NguoiDung, user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Không tìm thấy tài khoản")

    if user.anh_dai_dien:
        delete_stored_file(user.anh_dai_dien)
        user.anh_dai_dien = None
        await db.commit()
        await db.refresh(user)
    return user
