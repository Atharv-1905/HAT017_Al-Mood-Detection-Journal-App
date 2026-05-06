"""
MindTrace AI+ — GET /dashboard-analytics
==========================================
Return aggregated mood history for frontend charts.
"""
from __future__ import annotations
from fastapi import APIRouter, Depends, Query
from models.schemas import DashboardAnalyticsResponse
from analytics.aggregator import get_dashboard_data
from middleware.auth_middleware import require_auth

router = APIRouter(tags=["Dashboard"])


@router.get("/dashboard-analytics", response_model=DashboardAnalyticsResponse)
async def dashboard_analytics(
    limit: int = Query(default=90, ge=1, le=365, description="Number of recent entries"),
    auth: dict = Depends(require_auth),
):
    """Aggregated mood history, wellness averages, and risk trends."""
    return await get_dashboard_data(user_id=auth["user_id"], limit=limit)
