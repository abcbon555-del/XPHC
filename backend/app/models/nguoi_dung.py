import uuid
from datetime import datetime

from sqlalchemy import Boolean, Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.db.base import Base

pham_vi_xem_enum = Enum("gioi_han", "toan_bo", name="pham_vi_xem_enum", create_type=False)


class NguoiDung(Base):
    __tablename__ = "nguoi_dung"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ten_dang_nhap: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    mat_khau_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    ho_ten: Mapped[str] = mapped_column(String(150), nullable=False)
    chuc_vu: Mapped[str | None] = mapped_column(String(150), nullable=True)
    so_dt: Mapped[str | None] = mapped_column(String(20), nullable=True)
    email: Mapped[str | None] = mapped_column(String(150), nullable=True)
    anh_dai_dien: Mapped[str | None] = mapped_column(String(255), nullable=True)

    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    quyen_nhap_lieu: Mapped[bool] = mapped_column(Boolean, default=False)
    quyen_upload_tai_lieu: Mapped[bool] = mapped_column(Boolean, default=False)
    pham_vi_xem: Mapped[str] = mapped_column(pham_vi_xem_enum, default="gioi_han")
    quyen_xuat_bao_cao: Mapped[bool] = mapped_column(Boolean, default=False)
    # chi_lap_bien_ban: cot da co trong migration 0004 nhung CHUA duoc ap dung vao DB
    # (thieu quyen postgres superuser). Tam thoi comment de tranh loi UndefinedColumnError
    # lam hong toan bo dang nhap/API nguoi_dung. Bo comment sau khi chay xong migration 0004.
    # chi_lap_bien_ban: Mapped[bool] = mapped_column(Boolean, default=False)

    thon_phu_trach_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("thon.id"), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now())
