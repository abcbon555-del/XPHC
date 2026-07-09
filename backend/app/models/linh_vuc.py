import uuid

from sqlalchemy import Enum, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.thon import trang_thai_don_vi_enum


class LinhVucViPham(Base):
    __tablename__ = "linh_vuc_vi_pham"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ten_linh_vuc: Mapped[str] = mapped_column(String(150), nullable=False, unique=True)
    thu_tu_hien_thi: Mapped[int] = mapped_column(Integer, default=0)
    trang_thai: Mapped[str] = mapped_column(trang_thai_don_vi_enum, default="hoat_dong")
