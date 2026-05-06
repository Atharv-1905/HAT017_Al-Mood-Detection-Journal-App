from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ai.engine import MindTraceAIEngine
from ai.utils.models import AnalysisRequest, AIResponse

app = FastAPI(title="MindTrace AI Backend", description="Backend for the Reflectly-like Journaling App")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize AI Engine on startup
engine = None

@app.on_event("startup")
async def startup_event():
    global engine
    print("\n" + "="*60)
    print("🚀 INITIALIZING MINDTRACE AI ENGINE...")
    print("⏳ Loading Neural Networks into Memory (Hugging Face Models).")
    print("⚠️  If this is your first time, it is DOWNLOADING the models (~500MB).")
    print("⚠️  This can take 3-5 minutes depending on your internet speed.")
    print("⚠️  Please DO NOT close the terminal. Be patient!")
    print("="*60 + "\n")
    engine = MindTraceAIEngine()
    print("\n" + "="*60)
    print("✅ AI MODELS LOADED AND CACHED SUCCESSFULLY!")
    print("✅ SERVER IS NOW READY TO ACCEPT MOBILE REQUESTS!")
    print("="*60 + "\n")

@app.post("/api/analyze", response_model=AIResponse)
async def analyze_journal(request: AnalysisRequest):
    global engine
    if not engine:
        engine = MindTraceAIEngine()
    result = await engine.analyze(request)
    return result
