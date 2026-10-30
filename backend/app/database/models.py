import uuid
from datetime import datetime
from sqlalchemy import String, Integer, Float, Text, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.database.connection import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    transaction_id: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    from_wallet: Mapped[str] = mapped_column(String, nullable=False, index=True)
    to_wallet: Mapped[str] = mapped_column(String, nullable=False, index=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    timestamp: Mapped[str] = mapped_column(String, nullable=False)
    source: Mapped[str] = mapped_column(String, nullable=False, default="upload")
    created_at: Mapped[str] = mapped_column(String, nullable=False, default=lambda: datetime.utcnow().isoformat())


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    transaction_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    risk_score: Mapped[int] = mapped_column(Integer, nullable=False)
    risk_category: Mapped[str] = mapped_column(String, nullable=False, index=True)
    anomaly_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    explanation_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    model_version: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[str] = mapped_column(String, nullable=False, default=lambda: datetime.utcnow().isoformat())


class AuditRecord(Base):
    __tablename__ = "audit_records"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    transaction_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    chain_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    contract_address: Mapped[str | None] = mapped_column(String, nullable=True)
    blockchain_tx_hash: Mapped[str | None] = mapped_column(String, nullable=True)
    record_status: Mapped[str] = mapped_column(String, nullable=False, default="pending")
    created_at: Mapped[str] = mapped_column(String, nullable=False, default=lambda: datetime.utcnow().isoformat())
