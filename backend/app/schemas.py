from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, field_validator


# ─── Transaction ──────────────────────────────────────────────
class TransactionOut(BaseModel):
    id: str
    transaction_id: str
    from_wallet: str
    to_wallet: str
    amount: float
    timestamp: str
    source: str
    created_at: str
    risk_assessment: Optional["RiskAssessmentOut"] = None
    audit_record: Optional["AuditRecordOut"] = None


class TransactionListOut(BaseModel):
    items: List[TransactionOut]
    total: int
    page: int
    page_size: int
    total_pages: int


# ─── Risk Assessment ──────────────────────────────────────────
class ExplanationFactor(BaseModel):
    factor: str
    detail: str
    severity: str  # "high" | "medium" | "low"


class RiskAssessmentOut(BaseModel):
    id: str
    transaction_id: str
    risk_score: int
    risk_category: str
    anomaly_score: Optional[float]
    explanation: List[ExplanationFactor]
    model_version: str
    created_at: str
    disclaimer: str = (
        "Experimental anomaly score. Not a calibrated fraud probability. "
        "Do not use for legal or financial decisions."
    )


# ─── Audit Record ─────────────────────────────────────────────
class AuditRecordOut(BaseModel):
    id: str
    transaction_id: str
    chain_id: Optional[int]
    contract_address: Optional[str]
    blockchain_tx_hash: Optional[str]
    record_status: str
    created_at: str


class AuditSubmitRequest(BaseModel):
    transaction_id: str

    @field_validator("transaction_id")
    @classmethod
    def must_not_be_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("transaction_id must not be empty")
        return v.strip()


# ─── Dashboard ────────────────────────────────────────────────
class RiskCategoryCount(BaseModel):
    category: str
    count: int


class DashboardSummary(BaseModel):
    total_transactions: int
    high_risk_count: int
    critical_count: int
    wallets_observed: int
    risk_distribution: List[RiskCategoryCount]
    recent_alerts: List[TransactionOut]
    audit_count: int
    model_version: str


# ─── Health ───────────────────────────────────────────────────
class HealthResponse(BaseModel):
    status: str
    version: str
    model_loaded: bool
    blockchain_enabled: bool
    db_ok: bool
