class RiskDetector:
    def assess_risk(self, emotion: str, wellness_index: int) -> dict:
        risk_level = "low"
        trigger_intervention = False
        
        if wellness_index < 20 or (emotion in ["fear", "sadness", "anger"] and wellness_index < 35):
            risk_level = "high"
            trigger_intervention = True
        elif wellness_index < 50:
            risk_level = "medium"
            trigger_intervention = False
            
        return {
            "risk_level": risk_level,
            "trigger_intervention": trigger_intervention
        }
