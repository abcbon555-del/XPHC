import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.rate_limit import check_not_locked_out, record_failed_attempt, reset_attempts
from app.core.security import create_access_token, create_refresh_token, decode_token, verify_password
from app.db.session import get_db
from app.models.nguoi_dung import NguoiDung
from app.schemas.auth import LoginRequest, RefreshRequest, TokenResponse
from app.schemas.nguoi_dung import NguoiDungOut
from app.api.deps import CurrentUser

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    check_not_locked_out(payload.ten_dang_nhap)

    result = await db.execute(select(NguoiDung).where(NguoiDung.ten_dang_nhap == payload.ten_dang_nhap))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active or not verify_password(payload.mat_khau, user.mat_khau_hash):
        record_failed_attempt(payload.ten_dang_nhap)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Sai tên đăng nhập hoặc mật khẩu")

    reset_attempts(payload.ten_dang_nhap)
    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(payload: RefreshRequest, db: AsyncSession = Depends(get_db)):
    data = decode_token(payload.refresh_token)
    if data is None or data.get("type") != "refresh":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Token làm mới không hợp lệ")
    user_id = data["sub"]

    result = await db.execute(select(NguoiDung).where(NguoiDung.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Tài khoản không còn hiệu lực")

    return TokenResponse(
        access_token=create_access_token(user_id),
        refresh_token=create_refresh_token(user_id),
    )


@router.get("/me", response_model=NguoiDungOut)
async def me(current_user: CurrentUser):
    return current_user
