import uuid
from datetime import datetime

from sqlalchemy import Enum, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import DOUBLE_PRECISION, UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.db.base import Base

trang_thai_ho_so_enum = Enum(
    "moi_phat_hien",
    "da_ra_quyet_dinh",
    "da_giai_quyet_dut_diem",
    name="trang_thai_ho_so_enum",
    create_type=False,
)


class HoSoViPham(Base):
    __tablename__ = "ho_so_vi_pham"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    so_bien_ban: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    client_uuid: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), unique=True, nullable=True)

    doi_tuong_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("doi_tuong_vi_pham.id"), nullable=False
    )
    thon_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("thon.id"), nullable=False)
    linh_vuc_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("linh_vuc_vi_pham.id"), nullable=False
    )
    hanh_vi_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("hanh_vi_vi_pham.id"), nullable=True
    )
    hanh_vi_mo_ta_them: Mapped[str | None] = mapped_column(Text, nullable=True)

    ngay_lap: Mapped[datetime] = mapped_column(server_default=func.now())

    kinh_do: Mapped[float] = mapped_column(DOUBLE_PRECISION, nullable=False)
    vi_do: Mapped[float] = mapped_column(DOUBLE_PRECISION, nullable=False)
    dia_chi_map: Mapped[str | None] = mapped_column(Text, nullable=True)

    trang_thai_xu_ly: Mapped[str] = mapped_column(trang_thai_ho_so_enum, default="moi_phat_hien")
    so_tien_phat: Mapped[float] = mapped_column(Numeric(15, 0), default=0)

    nguoi_lap_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("nguoi_dung.id"), nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now())
