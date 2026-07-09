-- =====================================================================
-- DATABASE SCHEMA - He thong quan ly xu ly VPHC cap xa (XPHC)
-- PostgreSQL 15+
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;   -- dung cho tim kiem gan dung ten doi tuong
-- Tuy chon: bat postgis neu can truy van khong gian nang (ST_DWithin...)
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- ---------------------------------------------------------------------
-- ENUM TYPES
-- ---------------------------------------------------------------------
CREATE TYPE trang_thai_don_vi AS ENUM ('hoat_dong', 'ngung_hoat_dong');

CREATE TYPE pham_vi_xem_enum AS ENUM ('gioi_han', 'toan_bo');

CREATE TYPE trang_thai_ho_so_enum AS ENUM (
    'moi_phat_hien',           -- Do (chua xu ly)
    'da_ra_quyet_dinh',        -- Vang (da QD nhung chua nop phat/khac phuc)
    'da_giai_quyet_dut_diem'   -- Xanh la
);

CREATE TYPE danh_muc_file_enum AS ENUM (
    'bien_ban_va_anh',      -- (1) Bien ban ban dau + anh bang chung
    'quyet_dinh_xu_phat',   -- (2) File PDF co dau do/ky so
    'bien_lai_khac_phuc'    -- (3) Bien lai nop tien + anh khac phuc
);

-- ---------------------------------------------------------------------
-- 1. BANG THON / DIA BAN
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 2. BANG NGUOI DUNG / PHAN QUYEN (checkbox-based, khong chi role co dinh)
-- ---------------------------------------------------------------------
CREATE TABLE nguoi_dung (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ten_dang_nhap           VARCHAR(50) NOT NULL UNIQUE,
    mat_khau_hash           VARCHAR(255) NOT NULL,
    ho_ten                  VARCHAR(150) NOT NULL,
    chuc_vu                 VARCHAR(150),               -- vd: Can bo Dia chinh, Pho Chu tich...
    so_dt                   VARCHAR(20),
    email                   VARCHAR(150),
    is_admin                BOOLEAN NOT NULL DEFAULT false,   -- Lanh dao xa: toan quyen
    is_active               BOOLEAN NOT NULL DEFAULT true,    -- vo hieu hoa thay vi xoa cung

    -- Cac quyen dang checkbox
    quyen_nhap_lieu         BOOLEAN NOT NULL DEFAULT false,  -- lap bien ban App/Web
    quyen_upload_tai_lieu   BOOLEAN NOT NULL DEFAULT false,  -- upload QD/bien lai
    pham_vi_xem             pham_vi_xem_enum NOT NULL DEFAULT 'gioi_han',
    quyen_xuat_bao_cao      BOOLEAN NOT NULL DEFAULT false,

    thon_phu_trach_id       UUID REFERENCES thon(id),  -- dung khi pham_vi_xem = gioi_han

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE nguoi_dung IS 'Tai khoan nhan su. Admin tao/vo hieu hoa va phan quyen bang checkbox.';

CREATE INDEX idx_nguoi_dung_thon ON nguoi_dung(thon_phu_trach_id);

-- ---------------------------------------------------------------------
-- 3. BANG DOI TUONG VI PHAM
-- ---------------------------------------------------------------------
CREATE TABLE doi_tuong_vi_pham (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ho_ten              VARCHAR(150) NOT NULL,
    so_cccd             VARCHAR(20) UNIQUE,
    so_dt               VARCHAR(20),
    dia_chi             TEXT,
    so_lan_tai_pham     INTEGER NOT NULL DEFAULT 0,   -- cache, cap nhat qua trigger
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_doi_tuong_cccd ON doi_tuong_vi_pham(so_cccd);
CREATE INDEX idx_doi_tuong_ho_ten ON doi_tuong_vi_pham USING gin (ho_ten gin_trgm_ops);

-- ---------------------------------------------------------------------
-- 4. DANH MUC LINH VUC VI PHAM & HANH VI (phuc vu bao cao ma tran)
-- ---------------------------------------------------------------------
CREATE TABLE linh_vuc_vi_pham (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ten_linh_vuc VARCHAR(150) NOT NULL UNIQUE,   -- Dat dai, Xay dung, Moi truong, Giao thong, ANTT...
    thu_tu_hien_thi INTEGER NOT NULL DEFAULT 0,
    trang_thai  trang_thai_don_vi NOT NULL DEFAULT 'hoat_dong'
);

CREATE TABLE hanh_vi_vi_pham (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    linh_vuc_id     UUID NOT NULL REFERENCES linh_vuc_vi_pham(id),
    ten_hanh_vi     TEXT NOT NULL,
    can_cu_phap_ly  VARCHAR(255),          -- vd: Dieu 12 Nghi dinh .../ND-CP
    trang_thai      trang_thai_don_vi NOT NULL DEFAULT 'hoat_dong'
);
CREATE INDEX idx_hanh_vi_linh_vuc ON hanh_vi_vi_pham(linh_vuc_id);

-- ---------------------------------------------------------------------
-- 5. BANG HO SO VI PHAM (bang trung tam)
-- ---------------------------------------------------------------------
CREATE TABLE ho_so_vi_pham (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    so_bien_ban         VARCHAR(50) NOT NULL UNIQUE,
    client_uuid         UUID UNIQUE,   -- id sinh tren Mobile luc offline, dung de sync idempotent

    doi_tuong_id        UUID NOT NULL REFERENCES doi_tuong_vi_pham(id),
    thon_id             UUID NOT NULL REFERENCES thon(id),
    linh_vuc_id         UUID NOT NULL REFERENCES linh_vuc_vi_pham(id),
    hanh_vi_id          UUID REFERENCES hanh_vi_vi_pham(id),
    hanh_vi_mo_ta_them  TEXT,          -- mo ta chi tiet neu can bo sung ngoai danh muc

    ngay_lap            TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Toa do va dia chi (chinh bang keo-tha ghim tren Map)
    kinh_do             DOUBLE PRECISION NOT NULL,   -- longitude
    vi_do               DOUBLE PRECISION NOT NULL,   -- latitude
    dia_chi_map         TEXT,                         -- ket qua reverse geocoding

    trang_thai_xu_ly    trang_thai_ho_so_enum NOT NULL DEFAULT 'moi_phat_hien',
    so_tien_phat        NUMERIC(15,0) NOT NULL DEFAULT 0,   -- dung cho bao cao ma tran tong tien

    nguoi_lap_id        UUID NOT NULL REFERENCES nguoi_dung(id),

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ho_so_thon ON ho_so_vi_pham(thon_id);
CREATE INDEX idx_ho_so_linh_vuc ON ho_so_vi_pham(linh_vuc_id);
CREATE INDEX idx_ho_so_trang_thai ON ho_so_vi_pham(trang_thai_xu_ly);
CREATE INDEX idx_ho_so_ngay_lap ON ho_so_vi_pham(ngay_lap);
CREATE INDEX idx_ho_so_doi_tuong ON ho_so_vi_pham(doi_tuong_id);
CREATE INDEX idx_ho_so_toa_do ON ho_so_vi_pham(vi_do, kinh_do);   -- phuc vu ban do

COMMENT ON TABLE ho_so_vi_pham IS 'Ho so vi pham hanh chinh. client_uuid dung de dong bo tu Mobile offline (idempotent upsert).';

-- ---------------------------------------------------------------------
-- 6. BANG FILE DINH KEM (3 danh muc ro rang)
-- ---------------------------------------------------------------------
CREATE TABLE ho_so_files (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ho_so_id        UUID NOT NULL REFERENCES ho_so_vi_pham(id) ON DELETE CASCADE,
    danh_muc        danh_muc_file_enum NOT NULL,
    ten_file_goc    VARCHAR(255) NOT NULL,
    duong_dan       TEXT NOT NULL,        -- path noi bo hoac object storage key
    loai_file       VARCHAR(50),          -- image/jpeg, video/mp4, application/pdf...
    dung_luong      BIGINT,
    nguoi_upload_id UUID NOT NULL REFERENCES nguoi_dung(id),
    uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ho_so_files_hoso ON ho_so_files(ho_so_id);
CREATE INDEX idx_ho_so_files_danhmuc ON ho_so_files(danh_muc);

-- ---------------------------------------------------------------------
-- 7. AUDIT LOG - APPEND ONLY, KHONG AI DUOC SUA/XOA
-- ---------------------------------------------------------------------
CREATE TABLE audit_log (
    id                  BIGSERIAL PRIMARY KEY,
    thoi_gian           TIMESTAMPTZ NOT NULL DEFAULT now(),
    tai_khoan_id        UUID REFERENCES nguoi_dung(id),
    hanh_dong           VARCHAR(255) NOT NULL,   -- vd: 'POST /api/v1/ho-so', 'LOGIN', 'EXPORT_REPORT'
    doi_tuong_tac_dong  VARCHAR(100),            -- vd: 'ho_so_vi_pham:<id>'
    noi_dung_chi_tiet   JSONB,
    dia_chi_ip          INET
);
CREATE INDEX idx_audit_thoi_gian ON audit_log(thoi_gian);
CREATE INDEX idx_audit_tai_khoan ON audit_log(tai_khoan_id);

-- --- Bao ve tang DB: chan UPDATE/DELETE/TRUNCATE tren audit_log ---
--
-- QUAN TRONG (da kiem chung thuc te khi trien khai thu):
-- Migration/schema nay BAT BUOC phai duoc chay boi mot role la OWNER cua
-- database (vd: superuser `postgres`), KHONG duoc chay bang chinh
-- `xphc_app_role`. Ly do: trong PostgreSQL, owner cua bang luon co toan
-- quyen tren bang do (bao gom ca ALTER TABLE ... DISABLE TRIGGER), BAT KE
-- REVOKE gi ap dung cho no. Neu de `xphc_app_role` vua la owner (vi du lo
-- tao database bang `CREATE DATABASE xphc_db OWNER xphc_app_role`) thi
-- REVOKE UPDATE/DELETE ben duoi VO NGHIA - role do van co the tu
-- `ALTER TABLE audit_log DISABLE TRIGGER ...` roi UPDATE/DELETE binh
-- thuong. Quy trinh dung: chay migration bang `postgres` (owner mac dinh),
-- roi GRANT quyen co kiem soat cho `xphc_app_role` (khong GRANT ownership).
--
-- Buoc 1: Tao role rieng cho ung dung ket noi runtime (KHONG dung superuser/owner)
-- CREATE ROLE xphc_app_role LOGIN PASSWORD 'change_me';
-- CREATE DATABASE xphc_db OWNER postgres;  -- KHONG de xphc_app_role la owner
-- GRANT CONNECT ON DATABASE xphc_db TO xphc_app_role;
-- (Chay toan bo file SQL nay / alembic upgrade bang role `postgres`, KHONG phai xphc_app_role)
-- GRANT USAGE ON SCHEMA public TO xphc_app_role;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO xphc_app_role;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO xphc_app_role;
-- Sau do REVOKE rieng tren audit_log:
REVOKE UPDATE, DELETE, TRUNCATE ON audit_log FROM PUBLIC;
-- Khi da tao xphc_app_role, chay them:
-- REVOKE UPDATE, DELETE, TRUNCATE ON audit_log FROM xphc_app_role;
-- GRANT SELECT, INSERT ON audit_log TO xphc_app_role;
--
-- Da kiem chung (2026-07-07): voi thiet lap dung nhu tren, xphc_app_role
-- INSERT duoc, con UPDATE/DELETE va ca ALTER TABLE (de tat trigger) deu bi
-- Postgres tu choi voi loi "permission denied" / "must be owner of table".

-- Phong ho them bang trigger chan UPDATE/DELETE ngay ca khi role bi cap nham quyen:
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

-- ---------------------------------------------------------------------
-- 8. TRIGGER: TU DONG CAP NHAT SO LAN TAI PHAM + updated_at
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 9. DU LIEU MAU DANH MUC LINH VUC (theo tham quyen UBND xa)
-- ---------------------------------------------------------------------
INSERT INTO linh_vuc_vi_pham (ten_linh_vuc, thu_tu_hien_thi) VALUES
    ('Dat dai', 1),
    ('Xay dung', 2),
    ('Moi truong', 3),
    ('Giao thong', 4),
    ('An ninh trat tu', 5);
