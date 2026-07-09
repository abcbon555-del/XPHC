import shutil
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.core.config import settings

CHUNK_SIZE = 1024 * 1024  # 1MB

DOCUMENT_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx", ".xls", ".xlsx"}
AVATAR_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def _validate_upload(upload: UploadFile, allowed_extensions: set[str]) -> str:
    ext = Path(upload.filename or "").suffix.lower()
    if ext not in allowed_extensions:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail=f"Định dạng file không được hỗ trợ. Chỉ chấp nhận: {', '.join(sorted(allowed_extensions))}",
        )
    return ext


async def _write_file(target_path: Path, upload: UploadFile) -> int:
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    size = 0
    try:
        with target_path.open("wb") as f:
            while chunk := await upload.read(CHUNK_SIZE):
                size += len(chunk)
                if size > max_bytes:
                    f.close()
                    target_path.unlink(missing_ok=True)
                    raise HTTPException(
                        status.HTTP_400_BAD_REQUEST,
                        detail=f"File vượt quá dung lượng tối đa {settings.MAX_UPLOAD_SIZE_MB}MB",
                    )
                f.write(chunk)
    except HTTPException:
        raise
    return size


async def save_upload_file(ho_so_id: uuid.UUID, danh_muc: str, upload: UploadFile) -> tuple[str, int]:
    """Luu file vao STORAGE_DIR/<ho_so_id>/<danh_muc>/<uuid><ext>.

    Tra ve (duong_dan_tuong_doi, dung_luong_bytes).
    Giai doan sau co the thay bang upload len S3/MinIO ma khong doi API endpoint.
    """
    ext = _validate_upload(upload, DOCUMENT_EXTENSIONS)
    target_dir = Path(settings.STORAGE_DIR) / str(ho_so_id) / danh_muc
    target_dir.mkdir(parents=True, exist_ok=True)

    safe_name = f"{uuid.uuid4().hex}{ext}"
    target_path = target_dir / safe_name

    size = await _write_file(target_path, upload)

    relative_path = str(target_path.as_posix())
    return relative_path, size


async def save_avatar_file(user_id: uuid.UUID, upload: UploadFile) -> str:
    """Luu anh dai dien vao STORAGE_DIR/avatars/<user_id>/<uuid><ext>.

    Tra ve duong_dan_tuong_doi. File cu (neu co) nen duoc xoa boi caller.
    """
    ext = _validate_upload(upload, AVATAR_EXTENSIONS)
    target_dir = Path(settings.STORAGE_DIR) / "avatars" / str(user_id)
    target_dir.mkdir(parents=True, exist_ok=True)

    safe_name = f"{uuid.uuid4().hex}{ext}"
    target_path = target_dir / safe_name

    await _write_file(target_path, upload)

    return str(target_path.as_posix())


def delete_stored_file(relative_path: str) -> None:
    """Xoa file vat ly tren dia neu ton tai va nam trong STORAGE_DIR. Khong bao loi neu file da bi xoa."""
    storage_root = Path(settings.STORAGE_DIR).resolve()
    path = Path(relative_path).resolve()
    if storage_root not in path.parents:
        return
    if path.exists() and path.is_file():
        path.unlink()


def delete_ho_so_directory(ho_so_id: uuid.UUID) -> None:
    """Xoa toan bo thu muc file dinh kem cua mot ho so (STORAGE_DIR/<ho_so_id>/).

    Dung khi xoa han ho so vi pham - don sach ca file vat ly tren dia, khong chi ban ghi DB.
    """
    storage_root = Path(settings.STORAGE_DIR).resolve()
    target_dir = (storage_root / str(ho_so_id)).resolve()
    if storage_root not in target_dir.parents:
        return
    if target_dir.exists() and target_dir.is_dir():
        shutil.rmtree(target_dir, ignore_errors=True)
