import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.connection import get_db
from app.database.models import AuditRecord, RiskAssessment
from app.schemas import AuditRecordOut, AuditSubmitRequest
from app.config import get_settings

router = APIRouter(prefix="/api/v1/audit-records", tags=["audit"])
settings = get_settings()


@router.get("", response_model=list[AuditRecordOut])
async def list_audit_records(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AuditRecord).order_by(AuditRecord.created_at.desc())
    )
    records = result.scalars().all()
    return [
        AuditRecordOut(
            id=r.id,
            transaction_id=r.transaction_id,
            chain_id=r.chain_id,
            contract_address=r.contract_address,
            blockchain_tx_hash=r.blockchain_tx_hash,
            record_status=r.record_status,
            created_at=r.created_at,
        )
        for r in records
    ]


@router.post("", response_model=AuditRecordOut)
async def create_audit_record(
    body: AuditSubmitRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Submit a finding for blockchain audit recording.

    The backend validates the risk assessment exists before recording.
    Risk score is re-read from the database — never trusted from the client.
    """
    # Verify transaction has been analyzed
    ra_result = await db.execute(
        select(RiskAssessment).where(
            RiskAssessment.transaction_id == body.transaction_id
        )
    )
    ra = ra_result.scalar_one_or_none()
    if not ra:
        raise HTTPException(
            422,
            f"Transaction '{body.transaction_id}' has not been analyzed yet. Run analysis first.",
        )

    # Check for existing audit record
    existing = await db.execute(
        select(AuditRecord).where(AuditRecord.transaction_id == body.transaction_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(409, "Audit record already exists for this transaction")

    status = "pending"
    blockchain_tx_hash = None
    chain_id = None
    contract_address = None

    if settings.blockchain_enabled:
        try:
            from app.services.contract import submit_finding
            result = await submit_finding(
                transaction_id=body.transaction_id,
                risk_score=ra.risk_score,
                category=ra.risk_category,
                model_version=ra.model_version,
            )
            blockchain_tx_hash = result["tx_hash"]
            chain_id = result["chain_id"]
            contract_address = result["contract_address"]
            status = "confirmed"
        except Exception as exc:
            # Don't fail — store as failed so user can see what happened
            status = "failed"

    record = AuditRecord(
        id=str(uuid.uuid4()),
        transaction_id=body.transaction_id,
        chain_id=chain_id or settings.chain_id,
        contract_address=contract_address or settings.contract_address or None,
        blockchain_tx_hash=blockchain_tx_hash,
        record_status=status,
        created_at=datetime.utcnow().isoformat(),
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)

    return AuditRecordOut(
        id=record.id,
        transaction_id=record.transaction_id,
        chain_id=record.chain_id,
        contract_address=record.contract_address,
        blockchain_tx_hash=record.blockchain_tx_hash,
        record_status=record.record_status,
        created_at=record.created_at,
    )
