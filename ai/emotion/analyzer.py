from transformers import pipeline
from ai.config import Config

class EmotionAnalyzer:
    def __init__(self):
        # Using DistilRoBERTa for faster inference
        self.pipeline = pipeline(
            "text-classification", 
            model=Config.EMOTION_MODEL, 
            top_k=1,
            device=-1  # Force CPU, change to 0 for GPU
        )

    def analyze(self, text: str) -> dict:
        result = self.pipeline(text)[0][0] # [[{label: ..., score: ...}]]
        return {
            "emotion": result["label"],
            "confidence": round(result["score"], 4)
        }
