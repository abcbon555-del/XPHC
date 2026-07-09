"""them chi_lap_bien_ban cho nguoi_dung (can bo chi duoc lap bien ban kiem tra hien trang)

Revision ID: 0004
Revises: 0003
Create Date: 2026-07-09

"""
from alembic import op

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None

UPGRADE_SQL = """
ALTER TABLE nguoi_dung ADD COLUMN chi_lap_bien_ban BOOLEAN NOT NULL DEFAULT FALSE;
"""

DOWNGRADE_SQL = """
ALTER TABLE nguoi_dung DROP COLUMN IF EXISTS chi_lap_bien_ban;
"""


def upgrade() -> None:
    op.execute(UPGRADE_SQL)


def downgrade() -> None:
    op.execute(DOWNGRADE_SQL)
