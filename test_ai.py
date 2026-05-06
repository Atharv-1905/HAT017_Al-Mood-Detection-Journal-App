import asyncio
from ai.engine import MindTraceAIEngine
from ai.utils.models import AnalysisRequest
import json
import time

async def main():
    # Initialize the engine (this will load models into memory)
    print("Loading models... this may take a moment on first run.")
    start_load = time.time()
    engine = MindTraceAIEngine()
    print(f"Models loaded in {time.time() - start_load:.2f} seconds.\n")

    # Sample journal entries reflecting different emotional states
    tests = [
        "I'm feeling so overwhelmed today. Everything is just too much, and I can't stop crying.",
        "I had a great day! Passed my exam and went out with friends. Life is good.",
        "I'm extremely furious about what happened at work. It's incredibly unfair!",
        "Just feeling a bit tired, but overall okay. Nothing special happened."
    ]

    for text in tests:
        print(f"--- Analyzing ---")
        print(f"Input: {text}")
        request = AnalysisRequest(text=text)
        
        start_inf = time.time()
        result = await engine.analyze(request)
        inf_time = time.time() - start_inf
        
        print(f"Inference Time: {inf_time:.4f} seconds")
        print("MANDATORY AI RESPONSE FORMAT:")
        print(json.dumps(result, indent=2))
        print("-" * 50 + "\n")

if __name__ == "__main__":
    asyncio.run(main())
