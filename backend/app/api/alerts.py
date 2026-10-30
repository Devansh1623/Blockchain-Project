import json
import math
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database.connection import get_db
from app.database.models import Transaction, RiskAssessment
from app.schemas import TransactionOut, RiskAssessmentOut, TransactionListOut

router = APIRouter(prefix="/api/v1/alerts", tags=["alerts"])


@router.get("", response_model=TransactionListOut)
async def list_alerts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category: Optional[str] = Query(None, description="HIGH|CRITICAL|MEDIUM|LOW"),
    db: AsyncSession = Depends(get_db),
):
    """Return all transactions that have been analyzed and flagged (scored)."""
    stmt = (
        select(Transaction, RiskAssessment)
        .join(RiskAssessment, Transaction.transaction_id == RiskAssessment.transaction_id)
        .order_by(RiskAssessment.risk_score.desc())
    )
    if category:
        stmt = stmt.where(RiskAssessment.risk_category == category.upper())

    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()
    rows = (await db.execute(stmt.offset((page - 1) * page_size).limit(page_size))).all()

    items = []
    for tx, ra in rows:
        explanation = json.loads(ra.explanation_json) if ra.explanation_json else []
        items.append(TransactionOut(
            id=tx.id,
            transaction_id=tx.transaction_id,
            from_wallet=tx.from_wallet,
            to_wallet=tx.to_wallet,
            amount=tx.amount,
            timestamp=tx.timestamp,
            source=tx.source,
            created_at=tx.created_at,
            risk_assessment=RiskAssessmentOut(
                id=ra.id,
                transaction_id=ra.transaction_id,
                risk_score=ra.risk_score,
                risk_category=ra.risk_category,
                anomaly_score=ra.anomaly_score,
                explanation=explanation,
                model_version=ra.model_version,
                created_at=ra.created_at,
            ),
        ))

    return TransactionListOut(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total else 0,
    )
