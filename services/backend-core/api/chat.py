"""
MindTrace AI+ — POST /chat
============================
Accept user text, maintain context history, return empathetic AI responses.
"""
from __future__ import annotations
from fastapi import APIRouter, Depends
from models.schemas import ChatRequest, ChatResponse
from services.chat_service import handle_chat
from middleware.auth_middleware import require_auth

router = APIRouter(tags=["Chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest, auth: dict = Depends(require_auth)):
    """Empathetic AI chat with context history and emotion awareness."""
    req.user_id = auth["user_id"]
    return await handle_chat(req)
