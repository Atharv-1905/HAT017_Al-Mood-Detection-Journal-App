"""
MindTrace AI+ — Pydantic Schemas
=================================
Defines every request / response / document model used across the platform.
All MongoDB collections are represented here as Pydantic v2 models.

Collections:
  users, journal_logs, emotion_logs, chatbot_history,
  reminders, sos_contacts, analytics, session_replays
"""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, EmailStr, Field


# ───────────────────────── Enums ──────────────────────────

class RiskLevel(str, Enum):
    NONE = "none"
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"


class EmotionLabel(str, Enum):
    JOY = "joy"
    SADNESS = "sadness"
    ANGER = "anger"
    FEAR = "fear"
    SURPRISE = "surprise"
    DISGUST = "disgust"
    NEUTRAL = "neutral"


# ───────────────────── Mandatory Response Schema ─────────────────────

class EmotionAnalysisResponse(BaseModel):
    """
    The MANDATORY response schema enforced across all emotion-related endpoints.
    Every field must be present in every response — no optional fields.
    """
    emotion: str = Field(..., description="Primary detected emotion label")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Model confidence score")
    sentiment: float = Field(..., ge=-1.0, le=1.0, description="Sentiment polarity (-1 negative → +1 positive)")
    wellness_index: int = Field(..., ge=0, le=100, description="Composite wellness score 0-100")
    risk_level: str = Field(..., description="Risk classification: none | low | moderate | high | critical")
    trigger_intervention: bool = Field(..., description="True when wellness_index < 30")
    suggestions: list[str] = Field(..., description="Actionable wellness suggestions")
    timestamp: str = Field(..., description="ISO-8601 UTC timestamp")


# ──────────────────── Auth Schemas ────────────────────────

class SignupRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(default="", max_length=100)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    username: str


# ──────────────────── Analyze / Journal Schemas ───────────────────

class AnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000, description="Raw journal / live text to analyze")
    user_id: Optional[str] = Field(default=None, description="Authenticated user ID (injected by middleware)")


class SaveJournalRequest(BaseModel):
    title: str = Field(default="Untitled Entry", max_length=200)
    content: str = Field(..., min_length=1, max_length=50000)
    tags: list[str] = Field(default_factory=list)
    mood_override: Optional[str] = Field(default=None, description="User-selected mood if different from AI")


class SaveJournalResponse(BaseModel):
    journal_id: str
    emotion_analysis: EmotionAnalysisResponse
    saved_at: str


# ──────────────────── SOS Schemas ─────────────────────────

class SOSContact(BaseModel):
    name: str = Field(..., max_length=100)
    email: EmailStr
    relationship: str = Field(default="emergency_contact", max_length=50)
    phone: Optional[str] = Field(default=None, max_length=20)


class TriggerSOSRequest(BaseModel):
    user_id: Optional[str] = None
    user_name: str = Field(default="User")
    contacts: list[SOSContact] = Field(..., min_length=1)
    message: Optional[str] = Field(default=None, max_length=2000)
    wellness_index: int = Field(..., ge=0, le=100)
    emotion: str = Field(default="unknown")


class TriggerSOSResponse(BaseModel):
    success: bool
    contacts_notified: int
    notifications: list[dict[str, Any]]
    timestamp: str


# ──────────────────── Chat Schemas ────────────────────────

class ChatRequest(BaseModel):
    user_id: str
    message: str = Field(..., min_length=1, max_length=5000)
    session_id: Optional[str] = Field(default=None)


class ChatMessage(BaseModel):
    role: str = Field(..., pattern=r"^(user|assistant|system)$")
    content: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ChatResponse(BaseModel):
    reply: str
    session_id: str
    emotion_snapshot: Optional[EmotionAnalysisResponse] = None
    timestamp: str


# ──────────────────── Dashboard / Analytics Schemas ───────

class MoodHistoryPoint(BaseModel):
    date: str
    emotion: str
    wellness_index: int
    sentiment: float


class DashboardAnalyticsResponse(BaseModel):
    user_id: str
    total_entries: int
    avg_wellness: float
    dominant_emotion: str
    mood_history: list[MoodHistoryPoint]
    risk_trend: list[dict[str, Any]]
    period: str = Field(default="30d")


# ──────────────────── MongoDB Document Models ─────────────

class UserDocument(BaseModel):
    """Maps to the `users` collection."""
    username: str
    email: str
    hashed_password: str
    full_name: str = ""
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    settings: dict[str, Any] = Field(default_factory=dict)
    is_active: bool = True


class JournalLogDocument(BaseModel):
    """Maps to the `journal_logs` collection."""
    user_id: str
    title: str = "Untitled Entry"
    content: str
    tags: list[str] = Field(default_factory=list)
    emotion: str = "neutral"
    confidence: float = 0.0
    sentiment: float = 0.0
    wellness_index: int = 50
    risk_level: str = "none"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class EmotionLogDocument(BaseModel):
    """Maps to the `emotion_logs` collection."""
    user_id: str
    text_snippet: str = ""
    emotion: str
    confidence: float
    sentiment: float
    wellness_index: int
    risk_level: str
    trigger_intervention: bool = False
    source: str = "live_analysis"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ChatbotHistoryDocument(BaseModel):
    """Maps to the `chatbot_history` collection."""
    user_id: str
    session_id: str
    messages: list[ChatMessage] = Field(default_factory=list)
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ReminderDocument(BaseModel):
    """Maps to the `reminders` collection."""
    user_id: str
    reminder_type: str = "journal"
    message: str = ""
    scheduled_at: str
    is_completed: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class SOSContactDocument(BaseModel):
    """Maps to the `sos_contacts` collection."""
    user_id: str
    contacts: list[SOSContact] = Field(default_factory=list)
    last_triggered_at: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class AnalyticsDocument(BaseModel):
    """Maps to the `analytics` collection — daily aggregation snapshots."""
    user_id: str
    date: str
    total_entries: int = 0
    avg_wellness: float = 50.0
    dominant_emotion: str = "neutral"
    emotions_breakdown: dict[str, int] = Field(default_factory=dict)
    risk_events: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class SessionReplayDocument(BaseModel):
    """Maps to the `session_replays` collection."""
    user_id: str
    session_id: str
    events: list[dict[str, Any]] = Field(default_factory=list)
    duration_ms: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
