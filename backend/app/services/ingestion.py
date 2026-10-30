"""
ChainSleuth — CSV ingestion service.
Validates, normalizes, and stores transaction records.
"""
import uuid
import io
from datetime import datetime
from typing import Tuple

import pandas as pd
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database.models import Transaction
from app.config import get_settings

settings = get_settings()

REQUIRED_COLUMNS = {"transaction_id", "from_wallet", "to_wallet", "amount", "timestamp"}


class IngestionError(Exception):
    pass


async def ingest_csv(
    content: bytes,
    source: str,
    db: AsyncSession,
) -> Tuple[int, int, list[str]]:
    """
    Parse, validate, deduplicate, and store transactions from CSV bytes.

    Returns (inserted, skipped_duplicates, errors).
    """
    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as exc:
        raise IngestionError(f"Could not parse CSV: {exc}") from exc

    # ── Column check ─────────────────────────────────────────
    missing = REQUIRED_COLUMNS - set(df.columns.str.lower().tolist())
    if missing:
        raise IngestionError(f"Missing required columns: {', '.join(sorted(missing))}")

    df.columns = df.columns.str.lower().str.strip()

    # ── Row limit ────────────────────────────────────────────
    if len(df) > settings.max_upload_rows:
        raise IngestionError(
            f"File contains {len(df)} rows; maximum allowed is {settings.max_upload_rows}."
        )

    # ── Normalize ────────────────────────────────────────────
    df["transaction_id"] = df["transaction_id"].astype(str).str.strip()
    df["from_wallet"] = df["from_wallet"].astype(str).str.strip().str.lower()
    df["to_wallet"] = df["to_wallet"].astype(str).str.strip().str.lower()
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce")
    df["timestamp"] = df["timestamp"].astype(str).str.strip()

    # ── Drop invalid rows ────────────────────────────────────
    errors: list[str] = []
    invalid_amount = df["amount"].isna() | (df["amount"] < 0)
    if invalid_amount.any():
        bad_ids = df.loc[invalid_amount, "transaction_id"].tolist()[:5]
        errors.append(f"Skipped {invalid_amount.sum()} rows with invalid amounts (e.g. {bad_ids})")
    df = df[~invalid_amount]

    missing_fields = (
        df["transaction_id"].isna()
        | df["from_wallet"].isna()
        | df["to_wallet"].isna()
    )
    if missing_fields.any():
        errors.append(f"Skipped {missing_fields.sum()} rows with missing required fields")
    df = df[~missing_fields]

    df = df.drop_duplicates(subset=["transaction_id"])

    # ── Existing TX IDs ──────────────────────────────────────
    tx_ids = df["transaction_id"].tolist()
    result = await db.execute(
        select(Transaction.transaction_id).where(Transaction.transaction_id.in_(tx_ids))
    )
    existing_ids = set(result.scalars().all())

    inserted = 0
    skipped = 0

    for _, row in df.iterrows():
        tid = str(row["transaction_id"])
        if tid in existing_ids:
            skipped += 1
            continue

        db.add(Transaction(
            id=str(uuid.uuid4()),
            transaction_id=tid,
            from_wallet=str(row["from_wallet"]),
            to_wallet=str(row["to_wallet"]),
            amount=float(row["amount"]),
            timestamp=str(row["timestamp"]),
            source=source,
            created_at=datetime.utcnow().isoformat(),
        ))
        existing_ids.add(tid)
        inserted += 1

    await db.commit()
    return inserted, skipped, errors
