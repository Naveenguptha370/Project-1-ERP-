"""Password hashing and signed JWT utilities."""

from datetime import datetime, timedelta, timezone
import secrets
from typing import Any, Optional, Union

import bcrypt
from jose import jwt

from app.core.config import settings


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        password_bytes = plain_password[:72].encode("utf-8")
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(password_bytes, hash_bytes)
    except (ValueError, TypeError):
        return False


def get_password_hash(password: str) -> str:
    password_bytes = password[:72].encode("utf-8")
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode("utf-8")


def create_access_token(
    data_or_subject: Union[dict, str, Any] = None,
    expires_delta: Optional[timedelta] = None,
    subject: Optional[Any] = None,
    data: Optional[dict] = None,
) -> str:
    target = data_or_subject
    if target is None:
        target = subject if subject is not None else data

    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    if isinstance(target, dict):
        payload = target.copy()
        payload.update({"exp": expire})
        payload.setdefault("iat", datetime.now(timezone.utc))
    else:
        payload = {
            "exp": expire,
            "sub": str(target),
            "iat": datetime.now(timezone.utc),
        }
    payload.setdefault("jti", secrets.token_urlsafe(32))
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except Exception:
        return None


def verify_token(token: str, secret_key: str = settings.SECRET_KEY) -> Optional[dict]:
    try:
        return jwt.decode(token, secret_key, algorithms=[settings.ALGORITHM])
    except Exception:
        return None
