"""
MindTrace AI+ — POST /signup & POST /login
=============================================
Standard JWT authentication endpoints.
"""
from __future__ import annotations
import logging
from fastapi import APIRouter, HTTPException, status
from models.schemas import SignupRequest, LoginRequest, AuthResponse, UserDocument
from auth.jwt_handler import hash_password, verify_password, create_access_token
from database.db import get_database, Collections
from utils.helpers import utc_now_iso

logger = logging.getLogger("mindtrace.api.auth")
router = APIRouter(tags=["Authentication"])


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def signup(req: SignupRequest):
    """Register a new user with hashed password and return JWT."""
    db = await get_database()
    users = db[Collections.USERS]

    # Check for existing email
    existing = await users.find_one({"email": req.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    # Check for existing username
    existing_name = await users.find_one({"username": req.username})
    if existing_name:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This username is already taken.",
        )

    # Create user document
    now = utc_now_iso()
    user_doc = UserDocument(
        username=req.username,
        email=req.email,
        hashed_password=hash_password(req.password),
        full_name=req.full_name,
        created_at=now,
        updated_at=now,
    )
    result = await users.insert_one(user_doc.model_dump())
    user_id = str(result.inserted_id)

    token = create_access_token(user_id=user_id, username=req.username)
    logger.info("✅ User registered: %s (%s)", req.username, req.email)

    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user_id=user_id,
        username=req.username,
    )


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    """Authenticate user credentials and return JWT."""
    db = await get_database()
    users = db[Collections.USERS]

    user = await users.find_one({"email": req.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not verify_password(req.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Contact support.",
        )

    user_id = str(user["_id"])
    token = create_access_token(user_id=user_id, username=user["username"])
    logger.info("🔑 User logged in: %s", user["username"])

    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user_id=user_id,
        username=user["username"],
    )
