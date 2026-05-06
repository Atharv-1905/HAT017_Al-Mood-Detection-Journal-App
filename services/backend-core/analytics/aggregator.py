"""
MindTrace AI+ — Analytics Aggregator
======================================
Computes aggregated mood history for frontend dashboard charts.
"""
from __future__ import annotations
import logging
from collections import Counter
from database.db import get_database, Collections
from models.schemas import DashboardAnalyticsResponse, MoodHistoryPoint

logger = logging.getLogger("mindtrace.analytics")


async def get_dashboard_data(user_id: str, limit: int = 90) -> DashboardAnalyticsResponse:
    """Aggregate emotion logs into dashboard-ready analytics."""
    db = await get_database()
    col = db[Collections.EMOTION_LOGS]

    cursor = col.find({"user_id": user_id}).sort("created_at", -1).limit(limit)
    logs = await cursor.to_list(length=limit)

    if not logs:
        return DashboardAnalyticsResponse(
            user_id=user_id, total_entries=0, avg_wellness=0.0,
            dominant_emotion="neutral", mood_history=[], risk_trend=[], period=f"{limit}d",
        )

    # Build mood history points
    mood_history = []
    emotions = []
    wellness_sum = 0.0
    risk_events = []

    for log in reversed(logs):
        mood_history.append(MoodHistoryPoint(
            date=log.get("created_at", ""),
            emotion=log.get("emotion", "neutral"),
            wellness_index=log.get("wellness_index", 50),
            sentiment=log.get("sentiment", 0.0),
        ))
        emotions.append(log.get("emotion", "neutral"))
        wellness_sum += log.get("wellness_index", 50)
        if log.get("trigger_intervention", False):
            risk_events.append({
                "date": log.get("created_at", ""),
                "wellness_index": log.get("wellness_index", 50),
                "emotion": log.get("emotion", "unknown"),
            })

    # Dominant emotion
    counter = Counter(emotions)
    dominant = counter.most_common(1)[0][0] if counter else "neutral"

    return DashboardAnalyticsResponse(
        user_id=user_id,
        total_entries=len(logs),
        avg_wellness=round(wellness_sum / len(logs), 1),
        dominant_emotion=dominant,
        mood_history=mood_history,
        risk_trend=risk_events,
        period=f"{limit}d",
    )
