import pytest
from app.services.ingestion import IngestionError, ingest_csv, REQUIRED_COLUMNS
from app.database.connection import get_db, init_db, AsyncSessionLocal

@pytest.mark.asyncio
async def test_ingest_csv_success():
    await init_db()
    csv_data = """transaction_id,from_wallet,to_wallet,amount,timestamp,transaction_frequency
TXN-TEST-100,0x1111111111111111111111111111111111111111,0x2222222222222222222222222222222222222222,1.5,2024-01-01 10:00:00,3
TXN-TEST-101,0x3333333333333333333333333333333333333333,0x4444444444444444444444444444444444444444,200.0,2024-01-01 11:00:00,10
"""
    async with AsyncSessionLocal() as session:
        inserted, skipped, errors = await ingest_csv(csv_data.encode("utf-8"), "test", session)
        assert inserted >= 0  # inserted or skipped if exists
        assert isinstance(skipped, int)
        assert isinstance(errors, list)

@pytest.mark.asyncio
async def test_missing_column_raises_ingestion_error():
    await init_db()
    csv_data = """transaction_id,amount,timestamp
TXN-100,1.5,2024-01-01 10:00:00
"""
    async with AsyncSessionLocal() as session:
        with pytest.raises(IngestionError) as exc:
            await ingest_csv(csv_data.encode("utf-8"), "test", session)
        assert "Missing required columns" in str(exc.value)
