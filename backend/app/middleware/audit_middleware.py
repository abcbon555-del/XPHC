import json
import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.security import decode_token
from app.db.session import AsyncSessionLocal
from app.models.audit_log import AuditLog

MUTATING_METHODS = {"POST", "PUT", "PATCH", "DELETE"}
MAX_BODY_LOG_BYTES = 8000


class AuditLogMiddleware(BaseHTTPMiddleware):
    """Ghi lai moi request lam thay doi du lieu (POST/PUT/PATCH/DELETE) vao bang audit_log.

    audit_log la bang chi-ghi: middleware chi INSERT, khong bao gio UPDATE/DELETE.
    """

    async def dispatch(self, request: Request, call_next):
        body_bytes = b""
        if request.method in MUTATING_METHODS:
            body_bytes = await request.body()

            async def receive():
                return {"type": "http.request", "body": body_bytes, "more_body": False}

            request._receive = receive  # noqa: SLF001 - can thiet de doc lai body cho endpoint

        response: Response = await call_next(request)

        if request.method in MUTATING_METHODS and response.status_code < 500:
            user_id = None
            auth_header = request.headers.get("authorization", "")
            if auth_header.lower().startswith("bearer "):
                payload = decode_token(auth_header[7:])
                if payload and payload.get("sub"):
                    try:
                        user_id = uuid.UUID(payload["sub"])
                    except ValueError:
                        user_id = None

            noi_dung = None
            if body_bytes:
                try:
                    noi_dung = json.loads(body_bytes[:MAX_BODY_LOG_BYTES])
                    if isinstance(noi_dung, dict):
                        noi_dung.pop("mat_khau", None)
                        noi_dung.pop("mat_khau_hash", None)
                except (json.JSONDecodeError, UnicodeDecodeError):
                    noi_dung = {"raw_len": len(body_bytes)}

            client_ip = request.client.host if request.client else None

            async with AsyncSessionLocal() as session:
                session.add(
                    AuditLog(
                        tai_khoan_id=user_id,
                        hanh_dong=f"{request.method} {request.url.path}",
                        doi_tuong_tac_dong=None,
                        noi_dung_chi_tiet={"status_code": response.status_code, "body": noi_dung},
                        dia_chi_ip=client_ip,
                    )
                )
                await session.commit()

        return response
