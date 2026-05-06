"""
MindTrace AI+ — POST /save-journal
====================================
Save completed journal entries to MongoDB with auto emotion analysis.
"""
from __future__ import annotations
import logging
from fastapi import APIRouter, Depends
from models.schemas import SaveJournalRequest, SaveJournalResponse, JournalLogDocument
from services.emotion_service import analyze_and_persist
from middleware.auth_middleware import require_auth
from database.db import get_database, Collections
from utils.helpers import utc_now_iso

logger = logging.getLogger("mindtrace.api.journal")
router = APIRouter(tags=["Journal"])


@router.post("/save-journal", response_model=SaveJournalResponse)
async def save_journal(req: SaveJournalRequest, auth: dict = Depends(require_auth)):
    """Save a journal entry and auto-analyze its emotional content."""
    user_id = auth["user_id"]

    # Run emotion analysis on the journal content
    analysis = await analyze_and_persist(req.content, user_id=user_id)

    # Build journal document
    now = utc_now_iso()
    journal = JournalLogDocument(
        user_id=user_id,
        title=req.title,
        content=req.content,
        tags=req.tags,
        emotion=req.mood_override or analysis.emotion,
        confidence=analysis.confidence,
        sentiment=analysis.sentiment,
        wellness_index=analysis.wellness_index,
        risk_level=analysis.risk_level,
        created_at=now,
    )

    db = await get_database()
    result = await db[Collections.JOURNAL_LOGS].insert_one(journal.model_dump())
    journal_id = str(result.inserted_id)

    logger.info("📓 Journal saved: %s for user %s", journal_id, user_id)

    return SaveJournalResponse(
        journal_id=journal_id,
        emotion_analysis=analysis,
        saved_at=now,
    )
