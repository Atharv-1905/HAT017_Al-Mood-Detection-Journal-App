"""
MindTrace AI+ — Vision endpoints
=================================
Ambient facial emotion analysis + facial emotion logs.
"""
from __future__ import annotations

import random
from typing import Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field

from database.db import get_database, Collections
from middleware.auth_middleware import require_auth
from utils.helpers import utc_now_iso

router = APIRouter(tags=["Vision"])


class AnalyzeVisionLiveRequest(BaseModel):
    frame: str = Field(..., min_length=10, description="Base64 data URL image frame")


class AnalyzeVisionLiveResponse(BaseModel):
    predicted_emotion: str
    confidence_score: float
    distress_level: str
    recommended_action: str
    timestamp: str


class FacialEmotionLogRequest(BaseModel):
    timestamp: Optional[str] = None
    predicted_emotion: str
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    recommended_action_taken: Optional[str] = None


@router.post("/analyze-vision-live", response_model=AnalyzeVisionLiveResponse)
async def analyze_vision_live(req: AnalyzeVisionLiveRequest, auth: dict = Depends(require_auth)):
    # Mock inference placeholder (replace with model inference service)
    emotions = ["joy", "neutral", "stress", "sadness"]
    predicted = random.choices(emotions, weights=[0.2, 0.35, 0.3, 0.15], k=1)[0]
    confidence = round(random.uniform(0.62, 0.95), 2)
    distress = "high" if predicted in {"stress", "sadness"} and confidence >= 0.7 else "low"
    action = "show_youtube" if predicted == "stress" else ("show_gifs" if predicted == "sadness" else "none")
    now = utc_now_iso()

    db = await get_database()
    await db[Collections.FACIAL_EMOTION_LOGS].insert_one({
        "user_id": auth["user_id"],
        "timestamp": now,
        "predicted_emotion": predicted,
        "confidence_score": confidence,
        "recommended_action_taken": None,
        "source": "ambient_camera",
    })

    return AnalyzeVisionLiveResponse(
        predicted_emotion=predicted,
        confidence_score=confidence,
        distress_level=distress,
        recommended_action=action,
        timestamp=now,
    )


@router.post("/facial-emotion-logs")
async def create_facial_emotion_log(req: FacialEmotionLogRequest, auth: dict = Depends(require_auth)):
    db = await get_database()
    insert_doc = {
        "user_id": auth["user_id"],
        "timestamp": req.timestamp or utc_now_iso(),
        "predicted_emotion": req.predicted_emotion,
        "confidence_score": req.confidence_score,
        "recommended_action_taken": req.recommended_action_taken,
    }
    result = await db[Collections.FACIAL_EMOTION_LOGS].insert_one(insert_doc)
    # Build explicit response object to avoid ObjectId serialization issues
    return {
        "id": str(result.inserted_id),
        "timestamp": insert_doc["timestamp"],
        "predicted_emotion": insert_doc["predicted_emotion"],
        "confidence_score": insert_doc["confidence_score"],
        "recommended_action_taken": insert_doc["recommended_action_taken"],
    }


@router.get("/facial-emotion-logs")
async def list_facial_emotion_logs(
    limit: int = Query(default=100, ge=1, le=1000),
    auth: dict = Depends(require_auth),
):
    db = await get_database()
    cursor = db[Collections.FACIAL_EMOTION_LOGS].find({"user_id": auth["user_id"]}).sort("timestamp", -1).limit(limit)
    logs = []
    async for doc in cursor:
        logs.append({
            "id": str(doc.get("_id")),
            "timestamp": doc.get("timestamp"),
            "predicted_emotion": doc.get("predicted_emotion"),
            "confidence_score": doc.get("confidence_score", 0),
            "recommended_action_taken": doc.get("recommended_action_taken"),
        })
    return {"logs": logs}
