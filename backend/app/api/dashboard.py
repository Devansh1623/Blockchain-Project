from fastapi import APIRouter, HTTPException
from sqlalchemy import select, func, distinct
from app.database.connection import get_db
from app.database.models import Transaction, RiskAssessment, AuditRecord
from app.ml.model import get_model_version
from app.schemas import DashboardSummary, RiskCategoryCount, TransactionOut, RiskAssessmentOut
import json
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
async def get_summary(db: AsyncSession = Depends(get_db)):
    # Total transactions
    total_result = await db.execute(select(func.count()).select_from(Transaction))
    total = total_result.scalar_one()

    # Wallets observed
    wallets_result = await db.execute(
        select(func.count(distinct(Transaction.from_wallet)))
    )
    wallets = wallets_result.scalar_one()

    # Risk distribution
    dist_result = await db.execute(
        select(RiskAssessment.risk_category, func.count().label("cnt"))
        .group_by(RiskAssessment.risk_category)
    )
    risk_dist = [
        RiskCategoryCount(category=row.risk_category, count=row.cnt)
        for row in dist_result.all()
    ]

    # High-risk count (HIGH + CRITICAL)
    high_result = await db.execute(
        select(func.count()).select_from(RiskAssessment).where(
            RiskAssessment.risk_category.in_(["HIGH", "CRITICAL"])
        )
    )
    high_risk = high_result.scalar_one()

    # Critical count
    crit_result = await db.execute(
        select(func.count()).select_from(RiskAssessment).where(
            RiskAssessment.risk_category == "CRITICAL"
        )
    )
    critical = crit_result.scalar_one()

    # Audit count
    audit_result = await db.execute(select(func.count()).select_from(AuditRecord))
    audit_count = audit_result.scalar_one()

    # Recent alerts (latest 5 high/critical scored transactions)
    recent_result = await db.execute(
        select(Transaction, RiskAssessment)
        .join(RiskAssessment, Transaction.transaction_id == RiskAssessment.transaction_id)
        .where(RiskAssessment.risk_category.in_(["HIGH", "CRITICAL"]))
        .order_by(RiskAssessment.created_at.desc())
        .limit(5)
    )
    recent_alerts = []
    for tx, ra in recent_result.all():
        explanation = json.loads(ra.explanation_json) if ra.explanation_json else []
        recent_alerts.append(TransactionOut(
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

    return DashboardSummary(
        total_transactions=total,
        high_risk_count=high_risk,
        critical_count=critical,
        wallets_observed=wallets,
        risk_distribution=risk_dist,
        recent_alerts=recent_alerts,
        audit_count=audit_count,
        model_version=get_model_version(),
    )
