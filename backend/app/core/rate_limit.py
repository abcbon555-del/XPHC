"""Gioi han so lan dang nhap sai lien tiep, chong brute-force mat khau.

Luu trang thai trong bo nho tien trinh (phu hop trien khai 1 worker/instance
cho tung don vi khach hang). Neu sau nay chay nhieu worker/instance dong thoi,
can thay bang Redis hoac store dung chung.
"""
import time

from fastapi import HTTPException, status

from app.core.config import settings

_failed_attempts: dict[str, list[float]] = {}


def _key(identifier: str) -> str:
    return identifier.strip().lower()


def check_not_locked_out(identifier: str) -> None:
    now = time.monotonic()
    window_start = now - settings.LOGIN_LOCKOUT_MINUTES * 60
    attempts = [t for t in _failed_attempts.get(_key(identifier), []) if t > window_start]
    _failed_attempts[_key(identifier)] = attempts
    if len(attempts) >= settings.LOGIN_MAX_ATTEMPTS:
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Đăng nhập sai quá {settings.LOGIN_MAX_ATTEMPTS} lần. "
            f"Vui lòng thử lại sau {settings.LOGIN_LOCKOUT_MINUTES} phút.",
        )


def record_failed_attempt(identifier: str) -> None:
    _failed_attempts.setdefault(_key(identifier), []).append(time.monotonic())


def reset_attempts(identifier: str) -> None:
    _failed_attempts.pop(_key(identifier), None)
