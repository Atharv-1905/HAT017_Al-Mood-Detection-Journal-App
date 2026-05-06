"""
MindTrace AI+ — Async MongoDB Connection (Motor)
==================================================
Provides a singleton async client, lazy database handle,
and typed collection accessors for all 8 collections.

Usage:
    from database.db import get_database, Collections
    db = await get_database()
    users = db[Collections.USERS]
"""

from __future__ import annotations

import os
import logging
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

logger = logging.getLogger("mindtrace.database")


# ─────────────────── Singleton Client ────────────────────

class _MongoManager:
    """Manages a single Motor client for the application lifetime."""

    _client: Optional[AsyncIOMotorClient] = None
    _db: Optional[AsyncIOMotorDatabase] = None

    @classmethod
    async def connect(cls) -> None:
        """Open connection pool — called once at FastAPI startup."""
        mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
        db_name = os.getenv("MONGO_DB_NAME", "mindtrace_ai")

        cls._client = AsyncIOMotorClient(
            mongo_uri,
            maxPoolSize=50,
            minPoolSize=10,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
        )
        cls._db = cls._client[db_name]

        # Verify connectivity
        try:
            await cls._client.admin.command("ping")
            logger.info("✅  MongoDB connected — database: %s", db_name)
        except Exception as exc:
            logger.error("❌  MongoDB connection failed: %s", exc)
            raise

        # Ensure indexes for hot-path queries
        await cls._ensure_indexes()

    @classmethod
    async def disconnect(cls) -> None:
        """Close connection pool — called at FastAPI shutdown."""
        if cls._client:
            cls._client.close()
            cls._client = None
            cls._db = None
            logger.info("🔌  MongoDB connection closed.")

    @classmethod
    def get_db(cls) -> AsyncIOMotorDatabase:
        """Return the database handle. Raises if not connected."""
        if cls._db is None:
            raise RuntimeError("Database not initialised — call MongoManager.connect() first.")
        return cls._db

    @classmethod
    async def _ensure_indexes(cls) -> None:
        """Create indexes that accelerate the most frequent queries."""
        db = cls.get_db()
        try:
            # Users — unique email
            await db[Collections.USERS].create_index("email", unique=True)
            # Emotion logs — user + time for dashboard aggregation
            await db[Collections.EMOTION_LOGS].create_index([("user_id", 1), ("created_at", -1)])
            # Journal logs — user + time
            await db[Collections.JOURNAL_LOGS].create_index([("user_id", 1), ("created_at", -1)])
            # Chatbot history — session lookup
            await db[Collections.CHATBOT_HISTORY].create_index([("user_id", 1), ("session_id", 1)])
            # Analytics — user + date
            await db[Collections.ANALYTICS].create_index([("user_id", 1), ("date", -1)])
            # Facial emotion logs — user + timestamp
            await db[Collections.FACIAL_EMOTION_LOGS].create_index([("user_id", 1), ("timestamp", -1)])
            logger.info("📇  Database indexes ensured.")
        except Exception as exc:
            logger.warning("Index creation warning (non-fatal): %s", exc)


class Collections:
    """String constants for collection names — single source of truth."""
    USERS = "users"
    JOURNAL_LOGS = "journal_logs"
    EMOTION_LOGS = "emotion_logs"
    CHATBOT_HISTORY = "chatbot_history"
    REMINDERS = "reminders"
    SOS_CONTACTS = "sos_contacts"
    ANALYTICS = "analytics"
    FACIAL_EMOTION_LOGS = "facial_emotion_logs"
    SESSION_REPLAYS = "session_replays"


# ──────────────── Public API ──────────────────────────────

async def connect_db() -> None:
    """Shortcut for startup hook."""
    await _MongoManager.connect()


async def disconnect_db() -> None:
    """Shortcut for shutdown hook."""
    await _MongoManager.disconnect()


async def get_database() -> AsyncIOMotorDatabase:
    """Dependency-injectable database handle."""
    return _MongoManager.get_db()
