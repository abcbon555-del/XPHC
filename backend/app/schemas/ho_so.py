import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class HoSoBase(BaseModel):
    doi_tuong_id: uuid.UUID
    thon_id: uuid.UUID
    linh_vuc_id: uuid.UUID
    hanh_vi_id: uuid.UUID | None = None
    hanh_vi_mo_ta_them: str | None = None
    kinh_do: float
    vi_do: float
    dia_chi_map: str | None = None
    so_tien_phat: float = 0


class HoSoCreate(HoSoBase):
    client_uuid: uuid.UUID | None = None


class HoSoSyncItem(HoSoBase):
    """Dung cho dong bo tu Mobile khi offline. client_uuid la khoa idempotent.

    so_bien_ban duoc server tu sinh theo thu tu ngay_lap (bien ban lap truoc co so truoc),
    khong nhan tu client nua.
    """

    client_uuid: uuid.UUID
    ngay_lap: datetime


class HoSoUpdate(BaseModel):
    trang_thai_xu_ly: Literal["moi_phat_hien", "da_ra_quyet_dinh", "da_giai_quyet_dut_diem"] | None = None
    so_tien_phat: float | None = None
    hanh_vi_mo_ta_them: str | None = None
    kinh_do: float | None = None
    vi_do: float | None = None
    dia_chi_map: str | None = None


class HoSoOut(HoSoBase):
    id: uuid.UUID
    so_bien_ban: str
    client_uuid: uuid.UUID | None = None
    ngay_lap: datetime
    trang_thai_xu_ly: str
    nguoi_lap_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class HoSoFileOut(BaseModel):
    id: uuid.UUID
    ho_so_id: uuid.UUID
    danh_muc: Literal["bien_ban_va_anh", "quyet_dinh_xu_phat", "bien_lai_khac_phuc"]
    ten_file_goc: str
    duong_dan: str
    loai_file: str | None = None
    uploaded_at: datetime

    class Config:
        from_attributes = True
