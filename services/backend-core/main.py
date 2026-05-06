"""
MindTrace AI+ — FastAPI Application Entry Point
=================================================
Async routing · Motor MongoDB · JWT Auth · HuggingFace NLP (mocked for MVP)

Run:
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""
from __future__ import annotations

import logging
import os
import sys
import time
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# ─────────────── Bootstrap ────────────────────────────────

# Ensure the backend-core directory is on sys.path so all local imports resolve
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

logging.basicConfig(
    level=logging.DEBUG if os.getenv("DEBUG", "true").lower() == "true" else logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("mindtrace")

# ─────────────── Lifespan (startup / shutdown) ───────────

@asynccontextmanager
async def lifespan(application: FastAPI):
    """Manage startup and shutdown events."""
    from database.db import connect_db, disconnect_db
    from ai.nlp_engine import NLPEngine

    logger.info("🚀 MindTrace AI+ — Starting up...")
    await connect_db()
    await NLPEngine.initialize()
    logger.info("✅ All systems online.")

    yield  # Application runs here

    logger.info("🛑 MindTrace AI+ — Shutting down...")
    await disconnect_db()
    logger.info("👋 Goodbye.")


# ─────────────── App Instance ────────────────────────────

app = FastAPI(
    title="MindTrace AI+",
    description=(
        "AI-powered mood detection and journaling backend. "
        "Real-time emotion analysis, empathetic chatbot, SOS interventions, "
        "and wellness analytics — all async, all fast."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ─────────────── CORS ────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────── Request Latency Middleware ──────────────

@app.middleware("http")
async def latency_logger(request: Request, call_next):
    """Log request latency for every call — target < 1s."""
    start = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = (time.perf_counter() - start) * 1000
    logger.debug(
        "%s %s — %.1fms [%s]",
        request.method, request.url.path, elapsed_ms, response.status_code,
    )
    response.headers["X-Process-Time-Ms"] = f"{elapsed_ms:.1f}"
    return response

# ─────────────── Register Routers ────────────────────────

from api.analyze import router as analyze_router
from api.sos import router as sos_router
from api.chat import router as chat_router
from api.dashboard import router as dashboard_router
from api.auth_routes import router as auth_router
from api.journal import router as journal_router
from api.vision import router as vision_router

app.include_router(auth_router, prefix="/api/v1")
app.include_router(analyze_router, prefix="/api/v1")
app.include_router(sos_router, prefix="/api/v1")
app.include_router(chat_router, prefix="/api/v1")
app.include_router(dashboard_router, prefix="/api/v1")
app.include_router(journal_router, prefix="/api/v1")
app.include_router(vision_router, prefix="/api/v1")

# ─────────────── Health Check ────────────────────────────

@app.get("/health", tags=["System"])
async def health_check():
    """Liveness probe."""
    return {"status": "healthy", "service": "MindTrace AI+", "version": "1.0.0"}


@app.get("/ready", tags=["System"])
async def readiness_check():
    """Readiness probe: verifies DB ping and NLP engine status."""
    from ai.nlp_engine import NLPEngine
    from database.db import get_database

    db_ok = False
    db_error = None
    try:
        db = await get_database()
        await db.command("ping")
        db_ok = True
    except Exception as exc:
        db_error = str(exc)

    nlp = NLPEngine.status()
    ready = db_ok and bool(nlp.get("ready"))
    return {
        "status": "ready" if ready else "not_ready",
        "database": {"ok": db_ok, "error": db_error},
        "nlp": nlp,
    }


@app.get("/", tags=["System"])
async def root():
    """Root redirect to docs."""
    return {
        "message": "MindTrace AI+ Backend is running.",
        "docs": "/docs",
        "health": "/health",
    }

# ─────────────── Global Exception Handler ────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception on %s %s: %s", request.method, request.url.path, exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please try again later."},
    )
