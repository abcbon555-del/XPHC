import uuid
from datetime import datetime

from sqlalchemy import Enum, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.db.base import Base

trang_thai_don_vi_enum = Enum(
    "hoat_dong", "ngung_hoat_dong", name="trang_thai_don_vi", create_type=False
)


class Thon(Base):
    __tablename__ = "thon"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ten_thon: Mapped[str] = mapped_column(String(150), nullable=False)
    ma_thon: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    trang_thai: Mapped[str] = mapped_column(trang_thai_don_vi_enum, nullable=False, default="hoat_dong")
    ghi_chu: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now())
