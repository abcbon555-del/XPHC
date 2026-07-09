"""them anh_dai_dien cho nguoi_dung + bang dem so bien ban theo nam (BB-KTHT)

Revision ID: 0003
Revises: 0002
Create Date: 2026-07-07

"""
from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None

UPGRADE_SQL = """
ALTER TABLE nguoi_dung ADD COLUMN anh_dai_dien VARCHAR(255) NULL;

CREATE TABLE bien_ban_counter (
    nam INTEGER PRIMARY KEY,
    so_hien_tai INTEGER NOT NULL DEFAULT 0
);

GRANT SELECT, INSERT, UPDATE ON bien_ban_counter TO xphc_app_role;
"""

DOWNGRADE_SQL = """
DROP TABLE IF EXISTS bien_ban_counter;
ALTER TABLE nguoi_dung DROP COLUMN IF EXISTS anh_dai_dien;
"""


def upgrade() -> None:
    op.execute(UPGRADE_SQL)


def downgrade() -> None:
    op.execute(DOWNGRADE_SQL)
