import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class NguoiDungBase(BaseModel):
    ho_ten: str
    chuc_vu: str | None = None
    so_dt: str | None = None
    email: str | None = None
    quyen_nhap_lieu: bool = False
    quyen_upload_tai_lieu: bool = False
    pham_vi_xem: Literal["gioi_han", "toan_bo"] = "gioi_han"
    quyen_xuat_bao_cao: bool = False
    # chi_lap_bien_ban: tam thoi tat vi cot DB chua duoc tao (xem models/nguoi_dung.py)
    thon_phu_trach_id: uuid.UUID | None = None


class NguoiDungCreate(NguoiDungBase):
    ten_dang_nhap: str
    mat_khau: str = Field(..., min_length=8, description="Mật khẩu tối thiểu 8 ký tự")


class NguoiDungUpdate(BaseModel):
    ho_ten: str | None = None
    chuc_vu: str | None = None
    so_dt: str | None = None
    email: str | None = None
    quyen_nhap_lieu: bool | None = None
    quyen_upload_tai_lieu: bool | None = None
    pham_vi_xem: Literal["gioi_han", "toan_bo"] | None = None
    quyen_xuat_bao_cao: bool | None = None
    thon_phu_trach_id: uuid.UUID | None = None
    is_active: bool | None = None
    mat_khau: str | None = Field(default=None, min_length=8, description="Mật khẩu tối thiểu 8 ký tự")


class NguoiDungOut(NguoiDungBase):
    id: uuid.UUID
    ten_dang_nhap: str
    is_admin: bool
    is_active: bool
    anh_dai_dien: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True
