"""Phuc vu tep dinh kem (anh vi pham, tai lieu, anh dai dien) CHI khi da xac thuc.

Truoc day storage duoc mount public qua StaticFiles - bat ky ai co URL deu tai duoc
anh/CCCD cong dan ma khong can dang nhap (lo hong A01). Endpoint nay bat buoc co token
va chan path traversal (chi cho phep tep nam trong STORAGE_DIR).
"""
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import FileResponse

from app.api.deps import CurrentUser
from app.core.config import settings

router = APIRouter(prefix="/files", tags=["files"])


@router.get("/tai-xuong")
async def tai_xuong_tep(
    current_user: CurrentUser,
    path: str = Query(..., description="Duong dan tuong doi cua tep trong storage (tu DB)"),
):
    root = Path(settings.STORAGE_DIR).resolve()
    target = Path(path).resolve()
    # Chan path traversal: tep phai nam trong STORAGE_DIR
    if root != target and root not in target.parents:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Đường dẫn tệp không hợp lệ")
    if not target.is_file():
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Không tìm thấy tệp")
    return FileResponse(target, headers={"X-Content-Type-Options": "nosniff"})
