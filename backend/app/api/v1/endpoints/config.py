from fastapi import APIRouter
from pydantic import BaseModel

from app.core.config import settings

router = APIRouter(prefix="/config", tags=["config"])


class PublicConfig(BaseModel):
    ten_don_vi: str
    ten_dia_phuong: str
    ten_co_quan_chu_quan: str
    mo_ta_don_vi: str
    ban_do_vi_do_mac_dinh: float
    ban_do_kinh_do_mac_dinh: float
    ban_do_zoom_mac_dinh: int
    logo_url: str | None


@router.get("", response_model=PublicConfig)
async def get_public_config():
    """Cau hinh white-label cong khai (khong can dang nhap) de frontend hien thi
    thuong hieu/toa do ban do rieng cho tung don vi trien khai, khong can sua code."""
    return PublicConfig(
        ten_don_vi=settings.TEN_DON_VI,
        ten_dia_phuong=settings.TEN_DIA_PHUONG,
        ten_co_quan_chu_quan=settings.TEN_CO_QUAN_CHU_QUAN,
        mo_ta_don_vi=settings.MO_TA_DON_VI,
        ban_do_vi_do_mac_dinh=settings.BAN_DO_VI_DO_MAC_DINH,
        ban_do_kinh_do_mac_dinh=settings.BAN_DO_KINH_DO_MAC_DINH,
        ban_do_zoom_mac_dinh=settings.BAN_DO_ZOOM_MAC_DINH,
        logo_url=settings.LOGO_URL,
    )
