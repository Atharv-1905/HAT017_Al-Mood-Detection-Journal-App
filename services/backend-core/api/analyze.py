"""
MindTrace AI+ — POST /analyze-live
====================================
Core endpoint: receive text → NLP analysis → wellness score → intervention logic.
"""
from __future__ import annotations
from fastapi import APIRouter, Depends
from models.schemas import AnalyzeRequest, EmotionAnalysisResponse
from services.emotion_service import analyze_and_persist
from middleware.auth_middleware import require_auth
from services.sos_service import trigger_sos
from models.schemas import TriggerSOSRequest
from database.db import get_database, Collections

router = APIRouter(tags=["Analysis"])


@router.post("/analyze-live", response_model=EmotionAnalysisResponse)
async def analyze_live(req: AnalyzeRequest, auth: dict = Depends(require_auth)):
    """
    CORE endpoint — Real-time emotion analysis.
    - Runs NLP on input text
    - Computes wellness score
    - If score < 30 → trigger_intervention = true
    - If score < 15 → auto-trigger SOS logic
    """
    user_id = auth["user_id"]
    result = await analyze_and_persist(req.text, user_id=user_id)

    # Auto-SOS for critical wellness
    if result.wellness_index < 15:
        db = await get_database()
        sos_doc = await db[Collections.SOS_CONTACTS].find_one({"user_id": user_id})
        if sos_doc and sos_doc.get("contacts"):
            from models.schemas import SOSContact
            contacts = [SOSContact(**c) for c in sos_doc["contacts"]]
            sos_req = TriggerSOSRequest(
                user_id=user_id,
                user_name=auth.get("username", "User"),
                contacts=contacts,
                wellness_index=result.wellness_index,
                emotion=result.emotion,
                message="Auto-triggered: wellness score dropped below critical threshold.",
            )
            await trigger_sos(sos_req)

    return result
