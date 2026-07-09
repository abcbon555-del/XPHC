import uuid
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_token
from app.db.session import get_db
from app.models.nguoi_dung import NguoiDung

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> NguoiDung:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Không thể xác thực tài khoản",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_token(token)
    if payload is None or payload.get("type") != "access":
        raise credentials_exception
    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    result = await db.execute(select(NguoiDung).where(NguoiDung.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise credentials_exception
    return user


CurrentUser = Annotated[NguoiDung, Depends(get_current_user)]


def require_admin(user: CurrentUser) -> NguoiDung:
    if not user.is_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Chỉ Lãnh đạo xã (Quản trị viên) được phép thực hiện thao tác này")
    return user


def require_nhap_lieu(user: CurrentUser) -> NguoiDung:
    if not (user.is_admin or user.quyen_nhap_lieu):
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Tài khoản không có quyền nhập liệu")
    return user


def require_upload(user: CurrentUser) -> NguoiDung:
    if not (user.is_admin or user.quyen_upload_tai_lieu):
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Tài khoản không có quyền tải lên tài liệu")
    return user


def require_export(user: CurrentUser) -> NguoiDung:
    if not (user.is_admin or user.quyen_xuat_bao_cao):
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Tài khoản không có quyền xuất báo cáo")
    return user


def apply_view_scope_filter(user: NguoiDung):
    """Tra ve (thon_id gioi han, nguoi_lap gioi han) de dung trong WHERE clause khi liet ke ho so.

    Neu None, None -> khong gioi han (xem toan bo).
    """
    if user.is_admin or user.pham_vi_xem == "toan_bo":
        return None, None
    return user.thon_phu_trach_id, user.id
