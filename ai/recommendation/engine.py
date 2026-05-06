class RecommendationEngine:
    def get_suggestions(self, emotion: str, risk_level: str) -> list:
        suggestions = []
        
        if risk_level == "high":
            suggestions.append("Consider taking 5 deep breaths using the 4-7-8 technique.")
            suggestions.append("Would you like to speak to a professional? Help is available.")
            return suggestions
            
        emotion = emotion.lower()
        if emotion == "anger":
            suggestions.append("Try stepping away for a moment and taking a short walk.")
            suggestions.append("Drink a glass of water to help center yourself.")
        elif emotion == "sadness":
            suggestions.append("Listen to your favorite calming playlist.")
            suggestions.append("Consider journaling your thoughts in more detail.")
        elif emotion == "fear":
            suggestions.append("Ground yourself: Name 5 things you can see around you.")
            suggestions.append("Remember this feeling is temporary.")
        elif emotion == "joy":
            suggestions.append("Capture this positive moment in your journal!")
            suggestions.append("Share your good mood with someone you care about.")
        else:
            suggestions.append("Take a moment to check in with your posture and breath.")
            
        return suggestions
