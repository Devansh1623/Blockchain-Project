"""
ChainSleuth — Isolation Forest training script.

Run from the backend/ directory:
    python -m app.ml.train

Outputs:
    app/ml/artifacts/model.pkl
    app/ml/artifacts/version.json
"""
import sys
import json
import hashlib
import logging
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import IsolationForest
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("chainsleuth.train")

FEATURES = [
    "amount",
    "log_amount",
    "amount_z_score",
    "tx_frequency",
    "unique_counterparties",
    "amount_rank_percentile",
]

ARTIFACTS_DIR = Path(__file__).parent / "artifacts"
ARTIFACTS_DIR.mkdir(exist_ok=True)

PROJECT_ROOT = Path(__file__).resolve().parents[3]
DATA_PATH = PROJECT_ROOT / "data" / "sample_transactions.csv"


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0.0)
    df["log_amount"] = np.log1p(df["amount"])

    mean = df["amount"].mean() or 1.0
    std  = df["amount"].std()  or 1.0
    df["amount_z_score"] = (df["amount"] - mean) / std
    df["amount_rank_percentile"] = df["amount"].rank(pct=True)

    if "transaction_frequency" in df.columns:
        df["tx_frequency"] = pd.to_numeric(df["transaction_frequency"], errors="coerce").fillna(1.0)
    else:
        df["tx_frequency"] = df.groupby("from_wallet")["transaction_id"].transform("count").fillna(1.0)

    df["unique_counterparties"] = df.groupby("from_wallet")["to_wallet"].transform("nunique").fillna(1.0)

    return df[FEATURES].fillna(0.0)


def main() -> None:
    logger.info("Loading training data from %s", DATA_PATH)

    if not DATA_PATH.exists():
        logger.error("Training data not found at %s", DATA_PATH)
        sys.exit(1)

    df_raw = pd.read_csv(DATA_PATH)
    logger.info("Loaded %d rows", len(df_raw))

    X = build_features(df_raw)
    logger.info("Feature matrix shape: %s", X.shape)

    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("iforest", IsolationForest(
            n_estimators=200,
            contamination=0.08,   # ~8% expected anomaly rate in demo data
            random_state=42,
            n_jobs=-1,
        )),
    ])

    logger.info("Training Isolation Forest…")
    pipeline.fit(X)

    model_path = ARTIFACTS_DIR / "model.pkl"
    joblib.dump(pipeline, model_path)

    model_bytes = model_path.read_bytes()
    model_hash = hashlib.sha256(model_bytes).hexdigest()[:12]
    version = f"1.0.0-{model_hash}"

    version_info = {
        "version": version,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "features": FEATURES,
        "n_estimators": 200,
        "contamination": 0.08,
        "dataset_size": len(df_raw),
        "model_hash_prefix": model_hash,
        "disclaimer": (
            "Unsupervised anomaly detection trained on synthetic data. "
            "Scores are not calibrated fraud probabilities."
        ),
    }

    version_path = ARTIFACTS_DIR / "version.json"
    with open(version_path, "w") as f:
        json.dump(version_info, f, indent=2)

    logger.info("✅ Model saved to %s", model_path)
    logger.info("✅ Version info: %s", version)

    # Quick self-test
    scores = pipeline.decision_function(X)
    anomaly_count = (scores < 0).sum()
    logger.info("Self-test: %d/%d samples flagged as anomalies", anomaly_count, len(X))


if __name__ == "__main__":
    main()
