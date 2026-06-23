import bcrypt
import logging
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session as DBSession

from database import get_db, settings
from models import Admin

logger          = logging.getLogger(__name__)
BCRYPT_MAX_BYTES = 72
BCRYPT_ROUNDS    = 12
bearer_scheme    = HTTPBearer(auto_error=False)


def _check_password_length(password: str) -> None:
    if len(password.encode("utf-8")) > BCRYPT_MAX_BYTES:
        raise ValueError(f"Password must be ≤ {BCRYPT_MAX_BYTES} bytes")


def hash_password(password: str) -> str:
    _check_password_length(password)
    salt   = bcrypt.gensalt(rounds=BCRYPT_ROUNDS)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        _check_password_length(plain)
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def _create_token(data: dict[str, Any], expires_delta: timedelta) -> str:
    payload = {
        **data,
        "exp": datetime.now(timezone.utc) + expires_delta,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_access_token(admin_id: int) -> str:
    return _create_token(
        {"sub": str(admin_id), "type": "access"},
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )


def create_refresh_token(admin_id: int) -> str:
    return _create_token(
        {"sub": str(admin_id), "type": "refresh"},
        timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )


def decode_token(token: str) -> dict[str, Any]:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="رمز غير صالح أو منتهي الصلاحية",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


def get_current_admin(
    request:     Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db:          DBSession = Depends(get_db),
) -> Admin:
    token: str | None = None

    if credentials and credentials.credentials:
        token = credentials.credentials

    if not token:
        token = request.cookies.get("admin_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="غير مصادق — يرجى تسجيل الدخول",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(token)

    if payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="نوع الرمز غير صحيح")

    admin: Admin | None = db.get(Admin, int(payload["sub"]))
    if not admin:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="المستخدم غير موجود")
    if not admin.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="الحساب معطّل")

    return admin


def require_super_admin(admin: Admin = Depends(get_current_admin)) -> Admin:
    if not admin.is_super_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="يتطلب صلاحيات المدير الرئيسي")
    return admin
