"""
ChainSleuth ML module — feature extraction for Isolation Forest.
"""
import numpy as np
import pandas as pd
from typing import Any


FEATURES = [
    "amount",
    "log_amount",
    "amount_z_score",
    "tx_frequency",
    "unique_counterparties",
    "amount_rank_percentile",
]


def extract_features(
    transactions: list[dict[str, Any]],
) -> pd.DataFrame:
    """
    Compute features from a list of raw transaction dicts.
    Handles missing optional fields gracefully.
    """
    df = pd.DataFrame(transactions)

    # ── Core amount features ──────────────────────────────────
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0.0)
    df["log_amount"] = np.log1p(df["amount"])

    global_mean = df["amount"].mean() or 1.0
    global_std  = df["amount"].std()  or 1.0
    df["amount_z_score"] = (df["amount"] - global_mean) / global_std

    df["amount_rank_percentile"] = df["amount"].rank(pct=True)

    # ── Frequency feature (precomputed or derived) ────────────
    if "transaction_frequency" in df.columns:
        df["tx_frequency"] = pd.to_numeric(
            df["transaction_frequency"], errors="coerce"
        ).fillna(1.0)
    else:
        # Approximate: count transactions per from_wallet
        freq = df.groupby("from_wallet")["transaction_id"].transform("count")
        df["tx_frequency"] = freq.fillna(1.0)

    # ── Counterparty diversity ────────────────────────────────
    counterparty_counts = (
        df.groupby("from_wallet")["to_wallet"]
        .transform("nunique")
    )
    df["unique_counterparties"] = counterparty_counts.fillna(1.0)

    return df[FEATURES].fillna(0.0)


def explain_features(features: dict[str, float]) -> list[dict[str, str]]:
    """
    Rule-based explanations derived from actual computed features.
    These are deterministic — never invented by an LLM.
    """
    reasons: list[dict[str, str]] = []

    if features.get("amount_z_score", 0) > 2.5:
        reasons.append({
            "factor": "Unusually high transaction amount",
            "detail": f"Amount is {features['amount_z_score']:.1f} std dev above the dataset mean",
            "severity": "high",
        })
    elif features.get("amount_z_score", 0) > 1.5:
        reasons.append({
            "factor": "Above-average transaction amount",
            "detail": f"Amount is {features['amount_z_score']:.1f} std dev above the dataset mean",
            "severity": "medium",
        })

    if features.get("tx_frequency", 0) > 30:
        reasons.append({
            "factor": "Extremely high transaction frequency",
            "detail": f"Wallet has ~{int(features['tx_frequency'])} transactions/day",
            "severity": "high",
        })
    elif features.get("tx_frequency", 0) > 10:
        reasons.append({
            "factor": "Elevated transaction frequency",
            "detail": f"Wallet has ~{int(features['tx_frequency'])} transactions/day",
            "severity": "medium",
        })

    if features.get("unique_counterparties", 0) > 15:
        reasons.append({
            "factor": "Many unique transaction recipients",
            "detail": f"Wallet interacted with {int(features['unique_counterparties'])} distinct addresses",
            "severity": "medium",
        })

    if features.get("amount_rank_percentile", 0) > 0.95:
        reasons.append({
            "factor": "Top 5% transaction amount in dataset",
            "detail": f"Amount ranks at {features['amount_rank_percentile'] * 100:.0f}th percentile",
            "severity": "medium",
        })

    if not reasons:
        reasons.append({
            "factor": "Statistical anomaly detected",
            "detail": "Transaction pattern deviates from the dataset baseline",
            "severity": "low",
        })

    return reasons
