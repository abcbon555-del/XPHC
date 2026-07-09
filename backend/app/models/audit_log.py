import uuid
from datetime import datetime

from sqlalchemy import BigInteger, ForeignKey, String
from sqlalchemy.dialects.postgresql import INET, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.db.base import Base


class AuditLog(Base):
    """Bang chi-ghi (append-only). Khong duoc UPDATE/DELETE - xem trigger trong database_schema.sql."""

    __tablename__ = "audit_log"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    thoi_gian: Mapped[datetime] = mapped_column(server_default=func.now())
    tai_khoan_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("nguoi_dung.id"), nullable=True
    )
    hanh_dong: Mapped[str] = mapped_column(String(255), nullable=False)
    doi_tuong_tac_dong: Mapped[str | None] = mapped_column(String(100), nullable=True)
    noi_dung_chi_tiet: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    dia_chi_ip: Mapped[str | None] = mapped_column(INET, nullable=True)
