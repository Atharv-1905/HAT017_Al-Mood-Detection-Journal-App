"""
MindTrace AI+ — Auth Middleware
================================
FastAPI dependency that extracts and validates JWT from Authorization header.
"""
from __future__ import annotations
import logging
from fastapi import Request, HTTPException, status
from auth.jwt_handler import decode_access_token
import jwt

logger = logging.getLogger("mindtrace.middleware")


async def require_auth(request: Request) -> dict:
    """
    FastAPI dependency — extracts JWT from `Authorization: Bearer <token>`.
    Returns the decoded payload dict with user_id and username.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header. Expected: Bearer <token>",
        )
    token = auth_header.split(" ", 1)[1]
    try:
        payload = decode_access_token(token)
        return {"user_id": payload["sub"], "username": payload.get("username", "")}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired.")
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid token: {exc}")
