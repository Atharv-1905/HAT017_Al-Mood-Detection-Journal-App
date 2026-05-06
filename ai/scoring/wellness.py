class WellnessIndexEngine:
    def calculate(self, emotion: str, sentiment: float, behavioral_trends: dict = None) -> int:
        """
        Calculates the Emotional Wellness Index (EWI)
        Scale: 0-100
        """
        base_score = 50
        
        # Adjust based on sentiment (-1.0 to 1.0) -> (-30 to +30)
        sentiment_adj = sentiment * 30
        
        # Adjust based on emotion label
        emotion_penalties = {
            "anger": -20,
            "disgust": -15,
            "fear": -25,
            "sadness": -25,
            "surprise": 0,
            "neutral": 5,
            "joy": 20
        }
        
        emotion_adj = emotion_penalties.get(emotion.lower(), 0)
        
        final_score = base_score + sentiment_adj + emotion_adj
        
        # Clamp to 0-100
        return int(max(0, min(100, final_score)))
