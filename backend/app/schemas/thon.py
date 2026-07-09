import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class ThonBase(BaseModel):
    ten_thon: str
    ma_thon: str
    ghi_chu: str | None = None


class ThonCreate(ThonBase):
    pass


class ThonUpdate(BaseModel):
    ten_thon: str | None = None
    ghi_chu: str | None = None
    trang_thai: Literal["hoat_dong", "ngung_hoat_dong"] | None = None


class ThonOut(ThonBase):
    id: uuid.UUID
    trang_thai: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
