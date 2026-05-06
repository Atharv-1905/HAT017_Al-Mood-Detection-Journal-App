import os

class Config:
    EMOTION_MODEL = "j-hartmann/emotion-english-distilroberta-base"
    SENTIMENT_MODEL = "cardiffnlp/twitter-roberta-base-sentiment-latest"
    EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
    CHATBOT_MODEL = "microsoft/DialoGPT-medium"
    DEVICE = "cpu"  # Set to "cuda" if GPU is available
