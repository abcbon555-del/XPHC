"""initial schema - tao toan bo bang, enum, trigger, audit log protection

Revision ID: 0001
Revises:
Create Date: 2026-07-07

"""
from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None

UPGRADE_SQL = """
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TYPE trang_thai_don_vi AS ENUM ('hoat_dong', 'ngung_hoat_dong');
CREATE TYPE pham_vi_xem_enum AS ENUM ('gioi_han', 'toan_bo');
CREATE TYPE trang_thai_ho_so_enum AS ENUM ('moi_phat_hien', 'da_ra_quyet_dinh', 'da_giai_quyet_dut_diem');
CREATE TYPE danh_muc_file_enum AS ENUM ('bien_ban_va_anh', 'quyet_dinh_xu_phat', 'bien_lai_khac_phuc');

CREATE TABLE thon (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ten_thon        VARCHAR(150) NOT NULL,
    ma_thon         VARCHAR(20)  NOT NULL UNIQUE,
    trang_thai      trang_thai_don_vi NOT NULL DEFAULT 'hoat_dong',
    ghi_chu         TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE thon IS 'Danh muc Thon/Dia ban thuoc xa. Admin them/sua/xoa (mem) qua UI.';

CREATE TABLE nguoi_dung (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ten_dang_nhap           VARCHAR(50) NOT NULL UNIQUE,
    mat_khau_hash           VARCHAR(255) NOT NULL,
    ho_ten                  VARCHAR(150) NOT NULL,
    chuc_vu                 VARCHAR(150),
    so_dt                   VARCHAR(20),
    email                   VARCHAR(150),
    is_admin                BOOLEAN NOT NULL DEFAULT false,
    is_active               BOOLEAN NOT NULL DEFAULT true,
    quyen_nhap_lieu         BOOLEAN NOT NULL DEFAULT false,
    quyen_upload_tai_lieu   BOOLEAN NOT NULL DEFAULT false,
    pham_vi_xem             pham_vi_xem_enum NOT NULL DEFAULT 'gioi_han',
    quyen_xuat_bao_cao      BOOLEAN NOT NULL DEFAULT false,
    thon_phu_trach_id       UUID REFERENCES thon(id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE nguoi_dung IS 'Tai khoan nhan su. Admin tao/vo hieu hoa va phan quyen bang checkbox.';
CREATE INDEX idx_nguoi_dung_thon ON nguoi_dung(thon_phu_trach_id);

CREATE TABLE doi_tuong_vi_pham (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ho_ten              VARCHAR(150) NOT NULL,
    so_cccd             VARCHAR(20) UNIQUE,
    so_dt               VARCHAR(20),
    dia_chi             TEXT,
    so_lan_tai_pham     INTEGER NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_doi_tuong_cccd ON doi_tuong_vi_pham(so_cccd);
CREATE INDEX idx_doi_tuong_ho_ten ON doi_tuong_vi_pham USING gin (ho_ten gin_trgm_ops);

CREATE TABLE linh_vuc_vi_pham (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ten_linh_vuc VARCHAR(150) NOT NULL UNIQUE,
    thu_tu_hien_thi INTEGER NOT NULL DEFAULT 0,
    trang_thai  trang_thai_don_vi NOT NULL DEFAULT 'hoat_dong'
);

CREATE TABLE hanh_vi_vi_pham (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    linh_vuc_id     UUID NOT NULL REFERENCES linh_vuc_vi_pham(id),
    ten_hanh_vi     TEXT NOT NULL,
    can_cu_phap_ly  VARCHAR(255),
    trang_thai      trang_thai_don_vi NOT NULL DEFAULT 'hoat_dong'
);
CREATE INDEX idx_hanh_vi_linh_vuc ON hanh_vi_vi_pham(linh_vuc_id);

CREATE TABLE ho_so_vi_pham (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    so_bien_ban         VARCHAR(50) NOT NULL UNIQUE,
    client_uuid         UUID UNIQUE,
    doi_tuong_id        UUID NOT NULL REFERENCES doi_tuong_vi_pham(id),
    thon_id             UUID NOT NULL REFERENCES thon(id),
    linh_vuc_id         UUID NOT NULL REFERENCES linh_vuc_vi_pham(id),
    hanh_vi_id          UUID REFERENCES hanh_vi_vi_pham(id),
    hanh_vi_mo_ta_them  TEXT,
    ngay_lap            TIMESTAMPTZ NOT NULL DEFAULT now(),
    kinh_do             DOUBLE PRECISION NOT NULL,
    vi_do               DOUBLE PRECISION NOT NULL,
    dia_chi_map         TEXT,
    trang_thai_xu_ly    trang_thai_ho_so_enum NOT NULL DEFAULT 'moi_phat_hien',
    so_tien_phat        NUMERIC(15,0) NOT NULL DEFAULT 0,
    nguoi_lap_id        UUID NOT NULL REFERENCES nguoi_dung(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ho_so_thon ON ho_so_vi_pham(thon_id);
CREATE INDEX idx_ho_so_linh_vuc ON ho_so_vi_pham(linh_vuc_id);
CREATE INDEX idx_ho_so_trang_thai ON ho_so_vi_pham(trang_thai_xu_ly);
CREATE INDEX idx_ho_so_ngay_lap ON ho_so_vi_pham(ngay_lap);
CREATE INDEX idx_ho_so_doi_tuong ON ho_so_vi_pham(doi_tuong_id);
CREATE INDEX idx_ho_so_toa_do ON ho_so_vi_pham(vi_do, kinh_do);
COMMENT ON TABLE ho_so_vi_pham IS 'Ho so vi pham hanh chinh. client_uuid dung de dong bo tu Mobile offline (idempotent upsert).';

CREATE TABLE ho_so_files (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ho_so_id        UUID NOT NULL REFERENCES ho_so_vi_pham(id) ON DELETE CASCADE,
    danh_muc        danh_muc_file_enum NOT NULL,
    ten_file_goc    VARCHAR(255) NOT NULL,
    duong_dan       TEXT NOT NULL,
    loai_file       VARCHAR(50),
    dung_luong      BIGINT,
    nguoi_upload_id UUID NOT NULL REFERENCES nguoi_dung(id),
    uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ho_so_files_hoso ON ho_so_files(ho_so_id);
CREATE INDEX idx_ho_so_files_danhmuc ON ho_so_files(danh_muc);

CREATE TABLE audit_log (
    id                  BIGSERIAL PRIMARY KEY,
    thoi_gian           TIMESTAMPTZ NOT NULL DEFAULT now(),
    tai_khoan_id        UUID REFERENCES nguoi_dung(id),
    hanh_dong           VARCHAR(255) NOT NULL,
    doi_tuong_tac_dong  VARCHAR(100),
    noi_dung_chi_tiet   JSONB,
    dia_chi_ip          INET
);
CREATE INDEX idx_audit_thoi_gian ON audit_log(thoi_gian);
CREATE INDEX idx_audit_tai_khoan ON audit_log(tai_khoan_id);

REVOKE UPDATE, DELETE, TRUNCATE ON audit_log FROM PUBLIC;

CREATE OR REPLACE FUNCTION fn_chan_sua_xoa_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Bảng nhật ký hệ thống (audit_log) chỉ cho phép ghi thêm, không được phép % dữ liệu.', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_chan_update_audit_log
    BEFORE UPDATE ON audit_log
    FOR EACH ROW EXECUTE FUNCTION fn_chan_sua_xoa_audit_log();

CREATE TRIGGER trg_chan_delete_audit_log
    BEFORE DELETE ON audit_log
    FOR EACH ROW EXECUTE FUNCTION fn_chan_sua_xoa_audit_log();

CREATE OR REPLACE FUNCTION fn_cap_nhat_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_updated_at_thon BEFORE UPDATE ON thon
    FOR EACH ROW EXECUTE FUNCTION fn_cap_nhat_updated_at();
CREATE TRIGGER trg_updated_at_nguoi_dung BEFORE UPDATE ON nguoi_dung
    FOR EACH ROW EXECUTE FUNCTION fn_cap_nhat_updated_at();
CREATE TRIGGER trg_updated_at_doi_tuong BEFORE UPDATE ON doi_tuong_vi_pham
    FOR EACH ROW EXECUTE FUNCTION fn_cap_nhat_updated_at();
CREATE TRIGGER trg_updated_at_ho_so BEFORE UPDATE ON ho_so_vi_pham
    FOR EACH ROW EXECUTE FUNCTION fn_cap_nhat_updated_at();

CREATE OR REPLACE FUNCTION fn_tang_so_lan_tai_pham()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE doi_tuong_vi_pham
    SET so_lan_tai_pham = (
        SELECT COUNT(*) FROM ho_so_vi_pham WHERE doi_tuong_id = NEW.doi_tuong_id
    )
    WHERE id = NEW.doi_tuong_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tang_tai_pham AFTER INSERT ON ho_so_vi_pham
    FOR EACH ROW EXECUTE FUNCTION fn_tang_so_lan_tai_pham();

INSERT INTO linh_vuc_vi_pham (ten_linh_vuc, thu_tu_hien_thi) VALUES
    ('Dat dai', 1),
    ('Xay dung', 2),
    ('Moi truong', 3),
    ('Giao thong', 4),
    ('An ninh trat tu', 5);
"""

DOWNGRADE_SQL = """
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS ho_so_files CASCADE;
DROP TABLE IF EXISTS ho_so_vi_pham CASCADE;
DROP TABLE IF EXISTS hanh_vi_vi_pham CASCADE;
DROP TABLE IF EXISTS linh_vuc_vi_pham CASCADE;
DROP TABLE IF EXISTS doi_tuong_vi_pham CASCADE;
DROP TABLE IF EXISTS nguoi_dung CASCADE;
DROP TABLE IF EXISTS thon CASCADE;

DROP FUNCTION IF EXISTS fn_tang_so_lan_tai_pham CASCADE;
DROP FUNCTION IF EXISTS fn_cap_nhat_updated_at CASCADE;
DROP FUNCTION IF EXISTS fn_chan_sua_xoa_audit_log CASCADE;

DROP TYPE IF EXISTS danh_muc_file_enum;
DROP TYPE IF EXISTS trang_thai_ho_so_enum;
DROP TYPE IF EXISTS pham_vi_xem_enum;
DROP TYPE IF EXISTS trang_thai_don_vi;
"""


def upgrade() -> None:
    op.execute(UPGRADE_SQL)


def downgrade() -> None:
    op.execute(DOWNGRADE_SQL)
