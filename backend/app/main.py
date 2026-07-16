from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from starlette.middleware.base import BaseHTTPMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.middleware.audit_middleware import AuditLogMiddleware


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Them cac header bao mat co ban (defense-in-depth) cho moi phan hoi."""

    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Permissions-Policy"] = "geolocation=(self), camera=(), microphone=()"
        if settings.is_production:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

app = FastAPI(
    title=settings.TEN_DON_VI,
    version="1.0.0",
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None if settings.is_production else "/redoc",
    openapi_url=None if settings.is_production else "/openapi.json",
)

Path(settings.STORAGE_DIR).mkdir(parents=True, exist_ok=True)
app.mount("/storage", StaticFiles(directory=settings.STORAGE_DIR), name="storage")

# O development, IP LAN cua may chu co the doi theo DHCP - cho phep bat ky origin nao
# trong dai IP rieng (192.168.x.x, 10.x.x.x) tren cong 5173 de khong phai sua CORS_ORIGINS
# tay moi khi IP doi. O production, chi dung danh sach CORS_ORIGINS tuong minh trong .env.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=None
    if settings.is_production
    else r"http://(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}):5173",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.add_middleware(AuditLogMiddleware)
app.add_middleware(SecurityHeadersMiddleware)

app.include_router(api_router)


@app.get("/health")
async def health():
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
    except Exception:
        return {"status": "error", "database": "unreachable"}
    return {"status": "ok", "database": "ok"}
