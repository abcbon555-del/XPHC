import uuid
from datetime import datetime

from pydantic import BaseModel


class DoiTuongBase(BaseModel):
    ho_ten: str
    so_cccd: str | None = None
    so_dt: str | None = None
    dia_chi: str | None = None


class DoiTuongCreate(DoiTuongBase):
    pass


class DoiTuongUpdate(BaseModel):
    ho_ten: str | None = None
    so_cccd: str | None = None
    so_dt: str | None = None
    dia_chi: str | None = None


class DoiTuongOut(DoiTuongBase):
    id: uuid.UUID
    so_lan_tai_pham: int
    created_at: datetime

    class Config:
        from_attributes = True
