"""
ChainSleuth — FastAPI application entry point.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database.connection import init_db
from app.ml.model import load_model, is_model_loaded, get_model_version
from app.api import dashboard, transactions, alerts, audit

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("chainsleuth")
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ────────────────────────────────────────────────
    logger.info("Initializing database…")
    await init_db()
    logger.info("Database ready")

    logger.info("Loading ML model…")
    model_ok = load_model()
    if model_ok:
        logger.info("Model loaded: %s", get_model_version())
    else:
        logger.warning("ML model not available — run `python -m app.ml.train` first")

    yield

    # ── Shutdown ───────────────────────────────────────────────
    logger.info("Shutting down…")


app = FastAPI(
    title="ChainSleuth API",
    description="AI-powered blockchain fraud detection — research prototype",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ───────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────
app.include_router(dashboard.router)
app.include_router(transactions.router)
app.include_router(alerts.router)
app.include_router(audit.router)


# ── Health ─────────────────────────────────────────────────────
@app.get("/health", tags=["system"])
async def health():
    return {
        "status": "ok",
        "version": "1.0.0",
        "model_loaded": is_model_loaded(),
        "model_version": get_model_version(),
        "blockchain_enabled": settings.blockchain_enabled,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
