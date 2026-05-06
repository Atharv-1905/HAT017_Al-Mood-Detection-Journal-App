from transformers import pipeline
from ai.config import Config

class SentimentAnalyzer:
    def __init__(self):
        self.pipeline = pipeline(
            "text-classification", 
            model=Config.SENTIMENT_MODEL,
            top_k=1,
            device=-1
        )

    def analyze(self, text: str) -> float:
        result = self.pipeline(text)[0][0]
        label = result["label"].lower()
        score = result["score"]
        
        if "positive" in label:
            sentiment_score = score
        elif "negative" in label:
            sentiment_score = -score
        else:
            sentiment_score = 0.0
            
        return round(sentiment_score, 4)
