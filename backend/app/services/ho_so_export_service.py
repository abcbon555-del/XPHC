"""Gom toan bo ho so vi pham thanh 1 file ZIP de admin luu ve may, phuc vu quan ly
ho so giay. Cau truc: <Ten Thon>/<So bien ban>/ gom:
  - Thong-tin-ho-so.html : day du thong tin vu viec (mo bang trinh duyet, in ra giay)
  - 1-Bien-ban-va-anh-bang-chung/ , 2-Quyet-dinh-xu-phat/ , 3-Bien-lai-khac-phuc/ : file thuc
"""
import html
import os
import re
import tempfile
import zipfile
from datetime import datetime
from pathlib import Path
from urllib.parse import quote

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.doi_tuong import DoiTuongViPham
from app.models.hanh_vi import HanhViViPham
from app.models.ho_so import HoSoViPham
from app.models.ho_so_file import HoSoFile
from app.models.linh_vuc import LinhVucViPham
from app.models.nguoi_dung import NguoiDung
from app.models.thon import Thon

TRANG_THAI_LABEL = {
    "moi_phat_hien": "Mới phát hiện",
    "da_ra_quyet_dinh": "Đã ra Quyết định, chưa nộp phạt/khắc phục",
    "da_giai_quyet_dut_diem": "Đã giải quyết dứt điểm",
}
DANH_MUC_FOLDER = {
    "bien_ban_va_anh": "1-Bien-ban-va-anh-bang-chung",
    "quyet_dinh_xu_phat": "2-Quyet-dinh-xu-phat",
    "bien_lai_khac_phuc": "3-Bien-lai-khac-phuc",
}
DANH_MUC_LABEL = {
    "bien_ban_va_anh": "Biên bản ban đầu + Ảnh bằng chứng",
    "quyet_dinh_xu_phat": "Quyết định xử phạt",
    "bien_lai_khac_phuc": "Biên lai nộp tiền + Ảnh khắc phục hậu quả",
}
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}


def _safe(name: str) -> str:
    name = (name or "").strip()
    name = re.sub(r'[/\\:*?"<>|]', "-", name)
    name = re.sub(r"\s+", " ", name).strip()
    return name or "khong-ten"


def _url_path(*segments: str) -> str:
    return "/".join(quote(s) for s in segments)


def _tien(v) -> str:
    try:
        return f"{int(v):,}".replace(",", ".") + " VNĐ"
    except (TypeError, ValueError):
        return "0 VNĐ"


def _build_info_html(hs, thon, lv, hv, dt, nguoi_lap, placed) -> str:
    e = html.escape
    thon_ten = thon.ten_thon if thon else ""
    lv_ten = lv.ten_linh_vuc if lv else ""
    hv_ten = hv.ten_hanh_vi if (hs.hanh_vi_id and hv) else "Khác (xem mô tả chi tiết)"
    nguoi_lap_ten = nguoi_lap.ho_ten if nguoi_lap else "—"

    def row(k, v):
        return f'<tr><td class="k">{e(k)}</td><td>{e(str(v))}</td></tr>'

    thong_tin = [
        row("Số biên bản", hs.so_bien_ban),
        row("Thôn", thon_ten),
        row("Ngày lập biên bản", hs.ngay_lap.strftime("%H:%M %d/%m/%Y")),
        row("Lĩnh vực vi phạm", lv_ten),
        row("Hành vi vi phạm", hv_ten),
    ]
    if hs.hanh_vi_mo_ta_them:
        thong_tin.append(row("Mô tả chi tiết", hs.hanh_vi_mo_ta_them))
    thong_tin += [
        row("Địa chỉ (theo bản đồ)", hs.dia_chi_map or "(chưa có)"),
        row("Tọa độ", f"{hs.vi_do}, {hs.kinh_do}"),
        row("Trạng thái xử lý", TRANG_THAI_LABEL.get(hs.trang_thai_xu_ly, hs.trang_thai_xu_ly)),
        row("Số tiền phạt", _tien(hs.so_tien_phat)),
        row("Người lập biên bản", nguoi_lap_ten),
    ]

    doi_tuong = [
        row("Họ và tên", dt.ho_ten if dt else ""),
        row("Số CCCD", (dt.so_cccd if dt else "") or "(chưa có)"),
        row("Số điện thoại", (dt.so_dt if dt else "") or "(chưa có)"),
        row("Địa chỉ", (dt.dia_chi if dt else "") or "(chưa có)"),
        row("Số lần tái phạm", dt.so_lan_tai_pham if dt else 0),
    ]

    # Danh sach tep + nhung anh
    file_sections = ""
    by_danh_muc: dict[str, list] = {}
    for f, folder, arc_name, is_img in placed:
        by_danh_muc.setdefault(f.danh_muc, []).append((folder, arc_name, is_img, f.ten_file_goc))
    for danh_muc, items in by_danh_muc.items():
        file_sections += f'<h3>{e(DANH_MUC_LABEL.get(danh_muc, danh_muc))}</h3>'
        imgs = [(fo, an, ten) for (fo, an, im, ten) in items if im]
        docs = [(fo, an, ten) for (fo, an, im, ten) in items if not im]
        if imgs:
            file_sections += '<div class="imgs">'
            for folder, arc_name, ten in imgs:
                src = _url_path(folder, arc_name)
                file_sections += f'<figure><img src="{src}" alt="{e(ten)}"><figcaption>{e(ten)}</figcaption></figure>'
            file_sections += "</div>"
        if docs:
            file_sections += "<ul>"
            for folder, arc_name, ten in docs:
                href = _url_path(folder, arc_name)
                file_sections += f'<li><a href="{href}">{e(ten)}</a></li>'
            file_sections += "</ul>"
    if not placed:
        file_sections = '<p class="muted">Chưa có tệp đính kèm.</p>'

    return f"""<!doctype html>
<html lang="vi"><head><meta charset="utf-8">
<title>Hồ sơ {e(hs.so_bien_ban)}</title>
<style>
  body {{ font-family: "Segoe UI", Arial, sans-serif; color:#1a2333; max-width:820px; margin:24px auto; padding:0 16px; }}
  h1 {{ font-size:20px; text-align:center; text-transform:uppercase; }}
  h2 {{ font-size:15px; border-bottom:2px solid #0f3b63; padding-bottom:4px; margin-top:24px; }}
  h3 {{ font-size:13.5px; margin:14px 0 6px; }}
  table {{ width:100%; border-collapse:collapse; font-size:13.5px; }}
  td {{ padding:6px 8px; border-bottom:1px solid #e3e8f0; vertical-align:top; }}
  td.k {{ width:220px; color:#667085; }}
  .imgs {{ display:flex; flex-wrap:wrap; gap:10px; }}
  figure {{ margin:0; width:180px; }}
  figure img {{ width:100%; height:130px; object-fit:cover; border:1px solid #ccc; }}
  figcaption {{ font-size:11px; color:#667085; text-align:center; margin-top:2px; word-break:break-all; }}
  .muted {{ color:#667085; font-size:13px; }}
  .center {{ text-align:center; }}
</style></head><body>
<div class="center"><strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br>Độc lập - Tự do - Hạnh phúc</div>
<h1>Hồ sơ kiểm tra hiện trạng vi phạm hành chính</h1>
<div class="center">Số: {e(hs.so_bien_ban)}</div>
<h2>I. Thông tin chung</h2>
<table>{''.join(thong_tin)}</table>
<h2>II. Đối tượng vi phạm</h2>
<table>{''.join(doi_tuong)}</table>
<h2>III. Tài liệu đính kèm</h2>
{file_sections}
</body></html>"""


async def build_zip_ho_so(db: AsyncSession) -> tuple[str, str]:
    """Tao file ZIP toan bo ho so. Tra ve (duong_dan_tam, ten_file_tai_ve)."""
    thon_map = {t.id: t for t in (await db.execute(select(Thon))).scalars()}
    lv_map = {x.id: x for x in (await db.execute(select(LinhVucViPham))).scalars()}
    hv_map = {x.id: x for x in (await db.execute(select(HanhViViPham))).scalars()}
    dt_map = {x.id: x for x in (await db.execute(select(DoiTuongViPham))).scalars()}
    nd_map = {x.id: x for x in (await db.execute(select(NguoiDung))).scalars()}

    ho_so_list = list((await db.execute(select(HoSoViPham))).scalars().all())
    files_by_hoso: dict = {}
    for f in (await db.execute(select(HoSoFile))).scalars().all():
        files_by_hoso.setdefault(f.ho_so_id, []).append(f)

    def sort_key(hs):
        thon = thon_map.get(hs.thon_id)
        return (thon.ten_thon if thon else "zzz", hs.so_bien_ban)

    ho_so_list.sort(key=sort_key)

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".zip")
    try:
        with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zf:
            for hs in ho_so_list:
                thon = thon_map.get(hs.thon_id)
                base = f"{_safe(thon.ten_thon if thon else 'Chua-gan-thon')}/{_safe(hs.so_bien_ban)}"

                # Tinh truoc ten tep trong ZIP de HTML tham chieu dung
                placed = []
                counters: dict[str, int] = {}
                for f in files_by_hoso.get(hs.id, []):
                    disk = Path(f.duong_dan)
                    if not disk.is_file():
                        continue
                    folder = DANH_MUC_FOLDER.get(f.danh_muc, "khac")
                    counters[folder] = counters.get(folder, 0) + 1
                    arc_name = f"{counters[folder]:02d}-{_safe(f.ten_file_goc)}"
                    is_img = Path(f.ten_file_goc).suffix.lower() in IMAGE_EXTS or (f.loai_file or "").startswith("image/")
                    placed.append((f, folder, arc_name, is_img))

                html_content = _build_info_html(
                    hs, thon, lv_map.get(hs.linh_vuc_id), hv_map.get(hs.hanh_vi_id),
                    dt_map.get(hs.doi_tuong_id), nd_map.get(hs.nguoi_lap_id), placed,
                )
                zf.writestr(f"{base}/Thong-tin-ho-so.html", html_content)
                for f, folder, arc_name, _is_img in placed:
                    zf.write(Path(f.duong_dan), f"{base}/{folder}/{arc_name}")

            if not ho_so_list:
                zf.writestr("KHONG-CO-HO-SO.txt", "Chưa có hồ sơ vi phạm nào trong hệ thống.")
        tmp.close()
    except Exception:
        tmp.close()
        os.unlink(tmp.name)
        raise

    ten_tai = f"Ho-so-vi-pham-{datetime.now().strftime('%Y%m%d-%H%M')}.zip"
    return tmp.name, ten_tai
