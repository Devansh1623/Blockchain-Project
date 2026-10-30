import pytest
import numpy as np
import pandas as pd
from app.ml.features import extract_features, explain_features
from app.ml.model import if_score_to_risk

def test_feature_extraction():
    transactions = [
        {
            "transaction_id": "TXN-1",
            "from_wallet": "0xAAA",
            "to_wallet": "0xBBB",
            "amount": 10.0,
            "timestamp": "2024-01-01 10:00:00",
            "transaction_frequency": 5,
        },
        {
            "transaction_id": "TXN-2",
            "from_wallet": "0xAAA",
            "to_wallet": "0xCCC",
            "amount": 500.0,
            "timestamp": "2024-01-01 10:05:00",
            "transaction_frequency": 25,
        }
    ]
    
    features_df = extract_features(transactions)
    assert "amount" in features_df.columns
    assert "amount_z_score" in features_df.columns
    assert "tx_frequency" in features_df.columns
    assert len(features_df) == 2

def test_score_mapping():
    # raw_score close to -0.5 is anomalous (high risk)
    # raw_score close to +0.5 is normal (low risk)
    score_crit, cat_crit = if_score_to_risk(-0.4)
    assert cat_crit == "CRITICAL"
    assert score_crit >= 80

    score_low, cat_low = if_score_to_risk(0.4)
    assert cat_low == "LOW"
    assert score_low <= 20

def test_explanation_generation():
    features = {
        "amount_z_score": 3.2,
        "tx_frequency": 25,
        "unique_counterparties": 18,
    }
    explanations = explain_features(features)
    assert len(explanations) >= 3
    factors = [e["factor"] for e in explanations]
    assert any("amount" in f.lower() for f in factors)
    assert any("frequency" in f.lower() for f in factors)
