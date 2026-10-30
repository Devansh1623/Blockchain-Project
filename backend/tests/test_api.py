import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database.connection import init_db
from app.ml.model import load_model

@pytest.mark.asyncio
async def test_health_endpoint():
    load_model()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "version" in data

@pytest.mark.asyncio
async def test_dashboard_summary():
    await init_db()
    load_model()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/dashboard/summary")
        assert response.status_code == 200
        data = response.json()
        assert "total_transactions" in data
        assert "risk_distribution" in data

@pytest.mark.asyncio
async def test_transactions_pagination():
    await init_db()
    load_model()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/transactions?page=1&page_size=10")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert "page" in data
