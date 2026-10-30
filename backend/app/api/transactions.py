import json
import math
import uuid
import asyncio
from typing import Optional
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database.connection import get_db
from app.database.models import Transaction, RiskAssessment
from app.services.ingestion import ingest_csv, IngestionError
from app.ml import model as ml_model
from app.ml.features import extract_features, explain_features
from app.schemas import TransactionOut, TransactionListOut, RiskAssessmentOut
from app.config import get_settings

settings = get_settings()
router = APIRouter(prefix="/api/v1/transactions", tags=["transactions"])

MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB


# ─── Upload CSV ───────────────────────────────────────────────
@router.post("/upload")
async def upload_transactions(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(400, "Only .csv files are accepted")

    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, f"File too large (max {MAX_UPLOAD_BYTES // 1024 // 1024} MB)")

    try:
        inserted, skipped, errors = await ingest_csv(content, source="upload", db=db)
    except IngestionError as exc:
        raise HTTPException(422, str(exc))

    return {
        "inserted": inserted,
        "skipped_duplicates": skipped,
        "warnings": errors,
        "message": f"Imported {inserted} transactions ({skipped} duplicates skipped)",
    }


# ─── List transactions ────────────────────────────────────────
@router.get("", response_model=TransactionListOut)
async def list_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    risk: Optional[str] = Query(None, description="LOW|MEDIUM|HIGH|CRITICAL"),
    sort_by: Optional[str] = Query("created_at", description="amount|created_at|risk_score"),
    sort_dir: Optional[str] = Query("desc", description="asc|desc"),
    db: AsyncSession = Depends(get_db),
):
    # Base query with left-joined risk assessment
    stmt = select(Transaction, RiskAssessment).outerjoin(
        RiskAssessment, Transaction.transaction_id == RiskAssessment.transaction_id
    )

    if search:
        like = f"%{search.lower()}%"
        stmt = stmt.where(
            Transaction.transaction_id.ilike(like)
            | Transaction.from_wallet.ilike(like)
            | Transaction.to_wallet.ilike(like)
        )

    if risk:
        stmt = stmt.where(RiskAssessment.risk_category == risk.upper())

    # Count
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar_one()

    # Sort
    if sort_by == "amount":
        order_col = Transaction.amount
    elif sort_by == "risk_score":
        order_col = RiskAssessment.risk_score
    else:
        order_col = Transaction.created_at

    if sort_dir == "asc":
        stmt = stmt.order_by(order_col.asc())
    else:
        stmt = stmt.order_by(order_col.desc())

    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    rows = (await db.execute(stmt)).all()

    items = []
    for tx, ra in rows:
        explanation = json.loads(ra.explanation_json) if ra and ra.explanation_json else []
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
            ) if ra else None,
        ))

    return TransactionListOut(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total else 0,
    )


# ─── Get single transaction ───────────────────────────────────
@router.get("/{transaction_id}", response_model=TransactionOut)
async def get_transaction(
    transaction_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Transaction, RiskAssessment)
        .outerjoin(RiskAssessment, Transaction.transaction_id == RiskAssessment.transaction_id)
        .where(Transaction.transaction_id == transaction_id)
    )
    row = result.first()
    if not row:
        raise HTTPException(404, f"Transaction '{transaction_id}' not found")

    tx, ra = row
    explanation = json.loads(ra.explanation_json) if ra and ra.explanation_json else []
    return TransactionOut(
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
        ) if ra else None,
    )


# ─── Analyze all unscored transactions ───────────────────────
@router.post("/analyze")
async def analyze_transactions(db: AsyncSession = Depends(get_db)):
    if not ml_model.is_model_loaded():
        raise HTTPException(503, "ML model is not available. Run the training script first.")

    # Fetch transactions without a risk assessment
    scored_ids_result = await db.execute(select(RiskAssessment.transaction_id))
    scored_ids = set(scored_ids_result.scalars().all())

    all_txs_result = await db.execute(select(Transaction))
    all_txs = all_txs_result.scalars().all()
    unscored = [tx for tx in all_txs if tx.transaction_id not in scored_ids]

    if not unscored:
        return {"analyzed": 0, "message": "All transactions already have risk assessments"}

    # Build feature dicts
    tx_dicts = [
        {
            "transaction_id": tx.transaction_id,
            "from_wallet": tx.from_wallet,
            "to_wallet": tx.to_wallet,
            "amount": tx.amount,
            "timestamp": tx.timestamp,
        }
        for tx in unscored
    ]

    # Extract features across the full unscored batch for proper z-scores
    loop = asyncio.get_event_loop()
    feature_df = await loop.run_in_executor(None, extract_features, tx_dicts)
    feature_matrix = feature_df.values

    inference_results = await loop.run_in_executor(None, ml_model.run_inference, feature_matrix)

    version = ml_model.get_model_version()
    for tx, (risk_score, category, raw_score), feat_row in zip(
        unscored, inference_results, feature_df.to_dict("records")
    ):
        explanation = explain_features(feat_row)
        ra = RiskAssessment(
            id=str(uuid.uuid4()),
            transaction_id=tx.transaction_id,
            risk_score=risk_score,
            risk_category=category,
            anomaly_score=raw_score,
            explanation_json=json.dumps(explanation),
            model_version=version,
        )
        db.add(ra)

    await db.commit()
    return {
        "analyzed": len(unscored),
        "model_version": version,
        "message": f"Analyzed {len(unscored)} transactions",
    }
