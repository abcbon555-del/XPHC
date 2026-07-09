import uuid

from pydantic import BaseModel


class LinhVucOut(BaseModel):
    id: uuid.UUID
    ten_linh_vuc: str
    thu_tu_hien_thi: int
    trang_thai: str

    class Config:
        from_attributes = True


class HanhViOut(BaseModel):
    id: uuid.UUID
    linh_vuc_id: uuid.UUID
    ten_hanh_vi: str
    can_cu_phap_ly: str | None = None
    trang_thai: str

    class Config:
        from_attributes = True


class HanhViCreate(BaseModel):
    linh_vuc_id: uuid.UUID
    ten_hanh_vi: str
    can_cu_phap_ly: str | None = None
