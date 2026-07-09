"""fix dau tieng viet linh_vuc_vi_pham + seed danh muc hanh_vi_vi_pham mau

Revision ID: 0002
Revises: 0001
Create Date: 2026-07-07

"""
from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None

UPGRADE_SQL = """
UPDATE linh_vuc_vi_pham SET ten_linh_vuc = 'Đất đai' WHERE ten_linh_vuc = 'Dat dai';
UPDATE linh_vuc_vi_pham SET ten_linh_vuc = 'Xây dựng' WHERE ten_linh_vuc = 'Xay dung';
UPDATE linh_vuc_vi_pham SET ten_linh_vuc = 'Môi trường' WHERE ten_linh_vuc = 'Moi truong';
UPDATE linh_vuc_vi_pham SET ten_linh_vuc = 'Giao thông' WHERE ten_linh_vuc = 'Giao thong';
UPDATE linh_vuc_vi_pham SET ten_linh_vuc = 'An ninh trật tự' WHERE ten_linh_vuc = 'An ninh trat tu';

INSERT INTO hanh_vi_vi_pham (linh_vuc_id, ten_hanh_vi)
SELECT id, hanh_vi FROM linh_vuc_vi_pham, LATERAL (VALUES
    ('Sử dụng đất không đúng mục đích được giao, cho thuê, công nhận quyền sử dụng đất'),
    ('Lấn, chiếm đất'),
    ('Chuyển nhượng, tặng cho quyền sử dụng đất không đủ điều kiện theo quy định'),
    ('Không đăng ký biến động đất đai theo quy định')
) AS v(hanh_vi)
WHERE ten_linh_vuc = 'Đất đai';

INSERT INTO hanh_vi_vi_pham (linh_vuc_id, ten_hanh_vi)
SELECT id, hanh_vi FROM linh_vuc_vi_pham, LATERAL (VALUES
    ('Xây dựng công trình không có giấy phép xây dựng'),
    ('Xây dựng sai nội dung giấy phép xây dựng được cấp'),
    ('Xây dựng công trình trên đất không được phép xây dựng'),
    ('Tổ chức thi công xây dựng vi phạm quy định về quản lý chất lượng công trình')
) AS v(hanh_vi)
WHERE ten_linh_vuc = 'Xây dựng';

INSERT INTO hanh_vi_vi_pham (linh_vuc_id, ten_hanh_vi)
SELECT id, hanh_vi FROM linh_vuc_vi_pham, LATERAL (VALUES
    ('Xả nước thải, chất thải chưa qua xử lý ra môi trường'),
    ('Không thực hiện đúng nội dung cam kết bảo vệ môi trường'),
    ('Gây ô nhiễm tiếng ồn, bụi vượt quy chuẩn cho phép'),
    ('Đổ, thải rác thải sinh hoạt không đúng nơi quy định')
) AS v(hanh_vi)
WHERE ten_linh_vuc = 'Môi trường';

INSERT INTO hanh_vi_vi_pham (linh_vuc_id, ten_hanh_vi)
SELECT id, hanh_vi FROM linh_vuc_vi_pham, LATERAL (VALUES
    ('Lấn chiếm lòng, lề đường để buôn bán, kinh doanh'),
    ('Dựng lều quán, mái che, biển hiệu trái phép trên vỉa hè, lòng đường'),
    ('Đổ vật liệu xây dựng, phế thải trên đường giao thông'),
    ('Điều khiển phương tiện chở quá tải trọng cho phép')
) AS v(hanh_vi)
WHERE ten_linh_vuc = 'Giao thông';

INSERT INTO hanh_vi_vi_pham (linh_vuc_id, ten_hanh_vi)
SELECT id, hanh_vi FROM linh_vuc_vi_pham, LATERAL (VALUES
    ('Gây rối trật tự công cộng'),
    ('Tổ chức đánh bạc trái phép'),
    ('Kinh doanh không có giấy phép hoặc không đúng ngành nghề đăng ký'),
    ('Không khai báo tạm trú, tạm vắng theo quy định')
) AS v(hanh_vi)
WHERE ten_linh_vuc = 'An ninh trật tự';
"""

DOWNGRADE_SQL = """
DELETE FROM hanh_vi_vi_pham;

UPDATE linh_vuc_vi_pham SET ten_linh_vuc = 'Dat dai' WHERE ten_linh_vuc = 'Đất đai';
UPDATE linh_vuc_vi_pham SET ten_linh_vuc = 'Xay dung' WHERE ten_linh_vuc = 'Xây dựng';
UPDATE linh_vuc_vi_pham SET ten_linh_vuc = 'Moi truong' WHERE ten_linh_vuc = 'Môi trường';
UPDATE linh_vuc_vi_pham SET ten_linh_vuc = 'Giao thong' WHERE ten_linh_vuc = 'Giao thông';
UPDATE linh_vuc_vi_pham SET ten_linh_vuc = 'An ninh trat tu' WHERE ten_linh_vuc = 'An ninh trật tự';
"""


def upgrade() -> None:
    op.execute(UPGRADE_SQL)


def downgrade() -> None:
    op.execute(DOWNGRADE_SQL)
