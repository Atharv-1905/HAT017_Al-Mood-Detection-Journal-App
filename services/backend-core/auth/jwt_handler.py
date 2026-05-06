"""
MindTrace AI+ — JWT Authentication Handler
============================================
PyJWT-based token creation / verification with passlib bcrypt hashing.
"""
from __future__ import annotations
import os, logging
from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt
import bcrypt

logger = logging.getLogger("mindtrace.auth")

_SECRET = os.getenv("JWT_SECRET", "super-secret-change-me-in-production")
_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
_EXPIRY_MIN = int(os.getenv("JWT_EXPIRY_MINUTES", "1440"))


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, username: str, extra: Optional[dict] = None) -> str:
    payload = {
        "sub": user_id,
        "username": username,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=_EXPIRY_MIN),
    }
    if extra:
        payload.update(extra)
    return jwt.encode(payload, _SECRET, algorithm=_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decode and verify a JWT. Raises jwt.ExpiredSignatureError / jwt.InvalidTokenError."""
    return jwt.decode(token, _SECRET, algorithms=[_ALGORITHM])
