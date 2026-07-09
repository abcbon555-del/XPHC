import uuid
from datetime import datetime

from sqlalchemy import BigInteger, Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.db.base import Base

danh_muc_file_enum = Enum(
    "bien_ban_va_anh",
    "quyet_dinh_xu_phat",
    "bien_lai_khac_phuc",
    name="danh_muc_file_enum",
    create_type=False,
)


class HoSoFile(Base):
    __tablename__ = "ho_so_files"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ho_so_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ho_so_vi_pham.id", ondelete="CASCADE"), nullable=False
    )
    danh_muc: Mapped[str] = mapped_column(danh_muc_file_enum, nullable=False)
    ten_file_goc: Mapped[str] = mapped_column(String(255), nullable=False)
    duong_dan: Mapped[str] = mapped_column(String, nullable=False)
    loai_file: Mapped[str | None] = mapped_column(String(50), nullable=True)
    dung_luong: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    nguoi_upload_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("nguoi_dung.id"), nullable=False
    )
    uploaded_at: Mapped[datetime] = mapped_column(server_default=func.now())
