"""
MindTrace AI+ — POST /trigger-sos
===================================
Accept user data and mock-send emergency emails to SOS contacts.
"""
from __future__ import annotations
from fastapi import APIRouter, Depends
from models.schemas import TriggerSOSRequest, TriggerSOSResponse
from services.sos_service import trigger_sos
from middleware.auth_middleware import require_auth

router = APIRouter(tags=["SOS"])


@router.post("/trigger-sos", response_model=TriggerSOSResponse)
async def sos_endpoint(req: TriggerSOSRequest, auth: dict = Depends(require_auth)):
    """Trigger SOS notifications to all emergency contacts."""
    req.user_id = auth["user_id"]
    req.user_name = auth.get("username", req.user_name)
    return await trigger_sos(req)
