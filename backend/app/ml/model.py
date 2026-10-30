"""
ChainSleuth — ML model loader and inference engine.

The model is loaded ONCE at startup via FastAPI lifespan.
Inference is synchronous (scikit-learn) but called from async routes via run_in_executor.
"""
import json
import logging
from pathlib import Path
from typing import Optional

import joblib
import numpy as np
from sklearn.pipeline import Pipeline

from app.config import get_settings

logger = logging.getLogger("chainsleuth.ml")
settings = get_settings()

# Global model state — populated at startup
_pipeline: Optional[Pipeline] = None
_version_info: dict = {}


def load_model() -> bool:
    """Load model and version info from disk. Returns True on success."""
    global _pipeline, _version_info

    model_path = Path(settings.ml_model_path)
    version_path = Path(settings.ml_version_path)

    if not model_path.exists():
        logger.warning("Model file not found at %s — inference disabled", model_path)
        return False

    try:
        _pipeline = joblib.load(model_path)
        logger.info("Model loaded from %s", model_path)
    except Exception as exc:
        logger.error("Failed to load model: %s", exc)
        return False

    if version_path.exists():
        with open(version_path) as f:
            _version_info = json.load(f)
    else:
        _version_info = {"version": "unknown", "features": []}

    return True


def is_model_loaded() -> bool:
    return _pipeline is not None


def get_model_version() -> str:
    return _version_info.get("version", "unknown")


def if_score_to_risk(raw_score: float) -> tuple[int, str]:
    """
    Map Isolation Forest decision_function score → 0–100 risk scale.

    IForest decision_function: higher (closer to +0.5) = normal, lower = anomalous.
    We clamp to [-0.5, 0.5] then invert and scale.

    Risk categories (configurable thresholds):
        CRITICAL: 80–100
        HIGH:     60–79
        MEDIUM:   30–59
        LOW:      0–29
    """
    clamped = float(np.clip(raw_score, -0.5, 0.5))
    risk = int(round((0.5 - clamped) * 100))
    risk = max(0, min(100, risk))

    if risk >= 80:
        category = "CRITICAL"
    elif risk >= 60:
        category = "HIGH"
    elif risk >= 30:
        category = "MEDIUM"
    else:
        category = "LOW"

    return risk, category


def run_inference(feature_matrix: np.ndarray) -> list[tuple[int, str, float]]:
    """
    Run inference on a 2D numpy array.
    Returns list of (risk_score, risk_category, raw_anomaly_score).

    Raises RuntimeError if model is not loaded.
    """
    if _pipeline is None:
        raise RuntimeError("Model is not loaded. Call load_model() first.")

    raw_scores: np.ndarray = _pipeline.decision_function(feature_matrix)

    results = []
    for score in raw_scores:
        risk_score, category = if_score_to_risk(float(score))
        results.append((risk_score, category, float(score)))

    return results
