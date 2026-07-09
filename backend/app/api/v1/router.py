from fastapi import APIRouter

from app.api.v1.endpoints import audit_log, auth, config, danh_muc, doi_tuong, files, ho_so, nguoi_dung, reports, thon

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(config.router)
api_router.include_router(auth.router)
api_router.include_router(thon.router)
api_router.include_router(nguoi_dung.router)
api_router.include_router(doi_tuong.router)
api_router.include_router(danh_muc.router)
api_router.include_router(ho_so.router)
api_router.include_router(files.router)
api_router.include_router(reports.router)
api_router.include_router(audit_log.router)
