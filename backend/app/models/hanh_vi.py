import uuid

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.thon import trang_thai_don_vi_enum


class HanhViViPham(Base):
    __tablename__ = "hanh_vi_vi_pham"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    linh_vuc_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("linh_vuc_vi_pham.id"), nullable=False
    )
    ten_hanh_vi: Mapped[str] = mapped_column(Text, nullable=False)
    can_cu_phap_ly: Mapped[str | None] = mapped_column(String(255), nullable=True)
    trang_thai: Mapped[str] = mapped_column(trang_thai_don_vi_enum, default="hoat_dong")
