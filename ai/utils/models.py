from pydantic import BaseModel
from typing import List, Optional

class AnalysisRequest(BaseModel):
    text: str
    user_id: Optional[str] = None
    history: Optional[List[str]] = []

class AIResponse(BaseModel):
    emotion: str
    confidence: float
    sentiment: float
    wellness_index: int
    risk_level: str
    trigger_intervention: bool
    suggestions: List[str]
    timestamp: str
