import uuid
from datetime import datetime

from pydantic import BaseModel


class AuditLogOut(BaseModel):
    id: int
    thoi_gian: datetime
    tai_khoan_id: uuid.UUID | None = None
    hanh_dong: str
    doi_tuong_tac_dong: str | None = None
    noi_dung_chi_tiet: dict | None = None

    class Config:
        from_attributes = True
