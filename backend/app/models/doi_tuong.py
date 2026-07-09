import uuid
from datetime import datetime

from sqlalchemy import Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.db.base import Base


class DoiTuongViPham(Base):
    __tablename__ = "doi_tuong_vi_pham"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ho_ten: Mapped[str] = mapped_column(String(150), nullable=False)
    so_cccd: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True)
    so_dt: Mapped[str | None] = mapped_column(String(20), nullable=True)
    dia_chi: Mapped[str | None] = mapped_column(Text, nullable=True)
    so_lan_tai_pham: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now())
