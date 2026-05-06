"""
MindTrace AI+ — NLP Emotion Analysis Engine
=============================================
Structured for HuggingFace pipeline("text-classification").
Ships with a high-fidelity mock for MVP.
"""
from __future__ import annotations
import asyncio, logging, os, random
from datetime import datetime, timezone
from models.schemas import EmotionAnalysisResponse, RiskLevel

logger = logging.getLogger("mindtrace.ai")

_POS = frozenset({"happy","joy","love","grateful","excited","wonderful","amazing",
    "great","fantastic","blessed","peaceful","calm","hopeful","proud",
    "delighted","cheerful","content","optimistic","thrilled","inspired"})
_NEG = frozenset({"sad","angry","depressed","anxious","worried","scared","lonely",
    "hopeless","miserable","frustrated","hurt","cry","crying","pain",
    "exhausted","overwhelmed","broken","worthless","empty","numb"})
_CRISIS = frozenset({"suicide","kill myself","end my life","want to die",
    "self-harm","harm myself","no reason to live","better off dead"})

_SENT = {"joy":.85,"surprise":.3,"neutral":0.0,"sadness":-.6,"anger":-.7,"fear":-.65,"disgust":-.55}
_WELL = {"joy":85,"surprise":55,"neutral":50,"sadness":25,"anger":20,"fear":22,"disgust":28}

_SUGG = {
    "joy":["Keep nurturing this positive energy — journal about what made you feel this way.",
           "Share your happiness with someone you care about today."],
    "sadness":["It's okay to feel this way. Try a 5-minute guided breathing exercise.",
               "Reach out to someone you trust — talking helps more than you think.",
               "Write down three things you're grateful for."],
    "anger":["Pause before reacting. Try the 4-7-8 breathing technique.",
             "Physical activity can help release built-up tension safely."],
    "fear":["Ground yourself: name 5 things you see, 4 you touch, 3 you hear.",
            "Remember that anxiety often exaggerates danger — check the facts."],
    "disgust":["Step away from the situation if possible.",
               "Practice self-compassion — your feelings are valid."],
    "surprise":["Take a moment to process what happened before reacting."],
    "neutral":["A good time to set intentions for the rest of your day.",
               "Try a mindfulness check-in — how does your body feel right now?"],
    "crisis":["🚨 You are not alone. Please reach out to a crisis helpline immediately.",
              "📞 Suicide Prevention Lifeline: 988 (US) | 9152987821 (India — iCall)",
              "💬 Crisis Text Line: Text HOME to 741741",
              "Please talk to someone you trust right now — your life matters."],
}

class NLPEngine:
    """Async emotion analysis — mock for MVP, HuggingFace-ready for prod."""
    _pipeline = None
    _use_real: bool = False
    _ready: bool = False
    _fallback_reason: str | None = None

    @classmethod
    async def initialize(cls) -> None:
        cls._ready = False
        cls._fallback_reason = None
        cls._use_real = os.getenv("USE_REAL_MODEL","false").lower() == "true"
        if cls._use_real:
            model = os.getenv("HF_MODEL_NAME","j-hartmann/emotion-english-distilroberta-base")
            logger.info("🧠 Loading HuggingFace model: %s", model)
            try:
                from transformers import pipeline as hf_pipeline
                cls._pipeline = hf_pipeline("text-classification", model=model, top_k=None, device=-1)
                logger.info("✅ Model loaded successfully.")
                cls._ready = True
            except Exception as exc:
                logger.error("❌ Model load failed, falling back to mock: %s", exc)
                cls._use_real = False
                cls._fallback_reason = str(exc)
                cls._ready = True
        else:
            logger.info("🔬 NLP Engine running in MOCK mode (MVP).")
            cls._ready = True

    @classmethod
    async def analyze(cls, text: str) -> EmotionAnalysisResponse:
        if cls._use_real and cls._pipeline:
            try:
                return await cls._real(text)
            except Exception as exc:
                logger.warning("Real model inference failed, falling back to mock: %s", exc)
                cls._fallback_reason = str(exc)
                return await cls._mock(text)
        return await cls._mock(text)

    @classmethod
    def status(cls) -> dict:
        mode = "real" if cls._use_real and cls._pipeline else "mock"
        return {
            "ready": cls._ready,
            "mode": mode,
            "fallback_reason": cls._fallback_reason,
        }

    @classmethod
    async def _real(cls, text: str) -> EmotionAnalysisResponse:
        loop = asyncio.get_event_loop()
        results = await loop.run_in_executor(None, cls._pipeline, text[:512])
        scores = results[0] if isinstance(results[0], list) else results
        top = max(scores, key=lambda x: x["score"])
        return cls._build(text, top["label"].lower(), round(top["score"], 4))

    @classmethod
    async def _mock(cls, text: str) -> EmotionAnalysisResponse:
        await asyncio.sleep(random.uniform(0.01, 0.05))
        t = text.lower()
        for phrase in _CRISIS:
            if phrase in t:
                return cls._build(text, "sadness", 0.96, crisis=True)
        ph = sum(1 for w in _POS if w in t)
        nh = sum(1 for w in _NEG if w in t)
        if ph > nh:
            emotion, conf = "joy", min(0.65 + ph * 0.06, 0.97)
        elif nh > ph:
            if any(w in t for w in {"angry","frustrated","furious","rage"}): emotion = "anger"
            elif any(w in t for w in {"scared","anxious","worried","fear"}): emotion = "fear"
            else: emotion = "sadness"
            conf = min(0.60 + nh * 0.07, 0.95)
        else:
            emotion, conf = "neutral", round(random.uniform(0.45, 0.70), 4)
        conf = max(0.10, min(round(conf + random.uniform(-0.03, 0.03), 4), 0.99))
        return cls._build(text, emotion, conf)

    @classmethod
    def _build(cls, text: str, emotion: str, confidence: float, crisis: bool = False) -> EmotionAnalysisResponse:
        sentiment = _SENT.get(emotion, 0.0)
        wellness = int(_WELL.get(emotion, 50) * (0.5 + 0.5 * confidence))
        if crisis:
            wellness, sentiment = min(wellness, 10), -0.95
        if wellness >= 70: risk = RiskLevel.NONE.value
        elif wellness >= 50: risk = RiskLevel.LOW.value
        elif wellness >= 30: risk = RiskLevel.MODERATE.value
        elif wellness >= 15: risk = RiskLevel.HIGH.value
        else: risk = RiskLevel.CRITICAL.value
        trigger = wellness < 30
        suggestions = list(_SUGG.get("crisis" if crisis else emotion, _SUGG["neutral"]))
        if trigger and not crisis:
            suggestions.append("⚠️ Your wellness score is low. Please consider reaching out to someone.")
        return EmotionAnalysisResponse(
            emotion=emotion, confidence=confidence, sentiment=round(sentiment, 4),
            wellness_index=wellness, risk_level=risk, trigger_intervention=trigger,
            suggestions=suggestions, timestamp=datetime.now(timezone.utc).isoformat(),
        )
