"""
MindTrace AI+ — Chat Service
==============================
Maintains per-session context history and generates empathetic AI responses.
Uses a rule-based empathetic responder for MVP (swappable to LLM).
"""
from __future__ import annotations
import logging, uuid, random
from datetime import datetime, timezone
from database.db import get_database, Collections
from models.schemas import ChatRequest, ChatResponse, ChatMessage, EmotionAnalysisResponse
from ai.nlp_engine import NLPEngine

logger = logging.getLogger("mindtrace.services.chat")

# Empathetic response templates keyed by detected emotion
_RESPONSES = {
    "joy": [
        "That's wonderful to hear! 😊 What do you think contributed most to this feeling?",
        "I'm glad you're feeling positive! How can we keep this momentum going?",
        "It sounds like things are going well. Would you like to journal about this moment?",
    ],
    "sadness": [
        "I hear you, and I'm sorry you're feeling this way. Would you like to talk more about it?",
        "It's completely okay to feel sad sometimes. What's weighing on your mind the most?",
        "I'm here for you. Sometimes just expressing what we feel can help lighten the load.",
    ],
    "anger": [
        "It sounds like something really frustrated you. Want to tell me more about what happened?",
        "Feeling angry is valid. Let's try to unpack what triggered this — when you're ready.",
        "I understand. Take a deep breath with me. What would help you feel calmer right now?",
    ],
    "fear": [
        "It's okay to feel scared. You're safe here. What's making you feel anxious right now?",
        "Anxiety can feel overwhelming. Let's break down what's worrying you, one thing at a time.",
        "I'm here with you. Would it help to do a quick grounding exercise together?",
    ],
    "neutral": [
        "Thanks for sharing. How has your day been overall?",
        "I'm here whenever you need to talk. What's on your mind?",
        "Sounds like a calm moment. Is there anything specific you'd like to explore?",
    ],
    "disgust": [
        "That sounds like an unpleasant experience. Would you like to talk through it?",
        "I can understand why that would bother you. What do you need right now?",
    ],
    "surprise": [
        "Oh! That sounds unexpected. How are you feeling about it now?",
        "Surprises can be a lot to process. Take your time — I'm listening.",
    ],
}


async def handle_chat(req: ChatRequest) -> ChatResponse:
    """Process a chat message: analyze emotion, generate response, persist history."""
    session_id = req.session_id or str(uuid.uuid4())
    db = await get_database()
    col = db[Collections.CHATBOT_HISTORY]
    now = datetime.now(timezone.utc).isoformat()

    # Load or create session
    session = await col.find_one({"user_id": req.user_id, "session_id": session_id})
    messages = session["messages"] if session else []

    # Add user message
    user_msg = ChatMessage(role="user", content=req.message, timestamp=now)
    messages.append(user_msg.model_dump())

    # Analyze emotion of user message
    emotion_snap: EmotionAnalysisResponse = await NLPEngine.analyze(req.message)

    # Generate empathetic response
    pool = _RESPONSES.get(emotion_snap.emotion, _RESPONSES["neutral"])
    reply_text = random.choice(pool)

    # If intervention is triggered, prepend safety message
    if emotion_snap.trigger_intervention:
        reply_text = (
            "I notice you might be going through a really tough time. "
            "Please know that you're not alone and help is available. "
            "Would you like me to notify your emergency contacts?\n\n" + reply_text
        )

    # Add assistant message
    asst_msg = ChatMessage(role="assistant", content=reply_text, timestamp=now)
    messages.append(asst_msg.model_dump())

    # Persist session
    await col.update_one(
        {"user_id": req.user_id, "session_id": session_id},
        {"$set": {"messages": messages, "updated_at": now},
         "$setOnInsert": {"created_at": now}},
        upsert=True,
    )

    return ChatResponse(
        reply=reply_text,
        session_id=session_id,
        emotion_snapshot=emotion_snap,
        timestamp=now,
    )
