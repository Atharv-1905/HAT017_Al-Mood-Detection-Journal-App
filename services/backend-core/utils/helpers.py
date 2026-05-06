"""
MindTrace AI+ — Utility Helpers
=================================
Shared helper functions used across services.
"""
from __future__ import annotations
from datetime import datetime, timezone
from bson import ObjectId


def utc_now_iso() -> str:
    """Return current UTC time as ISO-8601 string."""
    return datetime.now(timezone.utc).isoformat()


def objectid_to_str(doc: dict) -> dict:
    """Convert MongoDB _id (ObjectId) to string for JSON serialization."""
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


def str_to_objectid(id_str: str) -> ObjectId:
    """Convert string to ObjectId, raises ValueError if invalid."""
    try:
        return ObjectId(id_str)
    except Exception:
        raise ValueError(f"Invalid ObjectId: {id_str}")
