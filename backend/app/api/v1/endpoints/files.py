import uuid
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, require_upload
from app.db.session import get_db
from app.models.ho_so import HoSoViPham
from app.models.ho_so_file import HoSoFile
from app.schemas.ho_so import HoSoFileOut
from app.services.storage_service import delete_stored_file, save_upload_file

router = APIRouter(prefix="/ho-so/{ho_so_id}/files", tags=["ho-so-files"])


@router.get("", response_model=list[HoSoFileOut])
async def list_files(ho_so_id: uuid.UUID, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(HoSoFile).where(HoSoFile.ho_so_id == ho_so_id))
    return result.scalars().all()


@router.post("", response_model=HoSoFileOut, status_code=status.HTTP_201_CREATED)
async def upload_file(
    ho_so_id: uuid.UUID,
    danh_muc: Literal["bien_ban_va_anh", "quyet_dinh_xu_phat", "bien_lai_khac_phuc"],
    file: UploadFile,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_upload),
):
    ho_so = await db.get(HoSoViPham, ho_so_id)
    if ho_so is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Không tìm thấy hồ sơ")

    duong_dan, dung_luong = await save_upload_file(ho_so_id, danh_muc, file)

    ho_so_file = HoSoFile(
        ho_so_id=ho_so_id,
        danh_muc=danh_muc,
        ten_file_goc=file.filename or "file",
        duong_dan=duong_dan,
        loai_file=file.content_type,
        dung_luong=dung_luong,
        nguoi_upload_id=current_user.id,
    )
    db.add(ho_so_file)
    await db.commit()
    await db.refresh(ho_so_file)
    return ho_so_file


@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(
    ho_so_id: uuid.UUID,
    file_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _perm=Depends(require_upload),
):
    ho_so_file = await db.get(HoSoFile, file_id)
    if ho_so_file is None or ho_so_file.ho_so_id != ho_so_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Không tìm thấy tệp")
    duong_dan = ho_so_file.duong_dan
    await db.delete(ho_so_file)
    await db.commit()
    delete_stored_file(duong_dan)
