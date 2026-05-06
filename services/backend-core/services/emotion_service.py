"""
MindTrace AI+ — Emotion Processing Service
=============================================
Orchestrates NLP analysis + persistence to emotion_logs collection.
"""
from __future__ import annotations
import logging
from ai.nlp_engine import NLPEngine
from database.db import get_database, Collections
from models.schemas import EmotionAnalysisResponse, EmotionLogDocument
from utils.helpers import utc_now_iso

logger = logging.getLogger("mindtrace.services.emotion")


async def analyze_and_persist(text: str, user_id: str | None = None) -> EmotionAnalysisResponse:
    """Run NLP analysis and persist the emotion log to MongoDB."""
    result = await NLPEngine.analyze(text)

    # Persist to emotion_logs if user is authenticated
    if user_id:
        db = await get_database()
        log = EmotionLogDocument(
            user_id=user_id,
            text_snippet=text[:200],
            emotion=result.emotion,
            confidence=result.confidence,
            sentiment=result.sentiment,
            wellness_index=result.wellness_index,
            risk_level=result.risk_level,
            trigger_intervention=result.trigger_intervention,
            source="live_analysis",
            created_at=utc_now_iso(),
        )
        await db[Collections.EMOTION_LOGS].insert_one(log.model_dump())
        logger.info("📝 Emotion log saved for user %s — %s (%.2f)", user_id, result.emotion, result.confidence)

    return result
