import datetime
import asyncio
from typing import Dict, Any

from ai.emotion.analyzer import EmotionAnalyzer
from ai.sentiment.analyzer import SentimentAnalyzer
from ai.scoring.wellness import WellnessIndexEngine
from ai.risk_detection.monitor import RiskDetector
from ai.recommendation.engine import RecommendationEngine
from ai.preprocessing.text import clean_text
from ai.utils.models import AIResponse, AnalysisRequest

class MindTraceAIEngine:
    def __init__(self):
        print("Initializing MindTrace AI Engine...")
        # Preload models into memory
        self.emotion_analyzer = EmotionAnalyzer()
        self.sentiment_analyzer = SentimentAnalyzer()
        self.wellness_engine = WellnessIndexEngine()
        self.risk_detector = RiskDetector()
        self.recommendation_engine = RecommendationEngine()
        print("AI Engine models loaded and ready.")

    async def analyze(self, request: AnalysisRequest) -> dict:
        """
        Main entry point for backend APIs to get the complete emotional analysis.
        Runs inference asynchronously to meet performance targets.
        """
        text = clean_text(request.text)
        
        # Run emotion and sentiment classification concurrently for speed
        emotion_task = asyncio.to_thread(self.emotion_analyzer.analyze, text)
        sentiment_task = asyncio.to_thread(self.sentiment_analyzer.analyze, text)
        
        emotion_result, sentiment_score = await asyncio.gather(emotion_task, sentiment_task)
        
        emotion = emotion_result["emotion"]
        confidence = emotion_result["confidence"]
        
        # Compute Wellness Index
        wellness_index = self.wellness_engine.calculate(emotion, sentiment_score)
        
        # Assess Risk Level
        risk_assessment = self.risk_detector.assess_risk(emotion, wellness_index)
        
        # Get AI Recommendations
        suggestions = self.recommendation_engine.get_suggestions(
            emotion=emotion, 
            risk_level=risk_assessment["risk_level"]
        )
        
        # Construct the MANDATORY AI RESPONSE FORMAT
        response = AIResponse(
            emotion=emotion,
            confidence=confidence,
            sentiment=sentiment_score,
            wellness_index=wellness_index,
            risk_level=risk_assessment["risk_level"],
            trigger_intervention=risk_assessment["trigger_intervention"],
            suggestions=suggestions,
            timestamp=datetime.datetime.utcnow().isoformat() + "Z"
        )
        
        return response.model_dump()
