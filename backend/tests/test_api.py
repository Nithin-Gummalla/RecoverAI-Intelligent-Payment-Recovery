import pytest
import pytest_asyncio
import hashlib
import hmac
import json
import uuid
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import engine


@pytest_asyncio.fixture(autouse=True)
async def dispose_database_engine_after_each_test():
    """Avoid carrying asyncpg connections into pytest's next event loop."""
    yield
    await engine.dispose()

@pytest.mark.asyncio
async def test_get_metrics():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/metrics/")
    assert response.status_code == 200
    data = response.json()
    assert "totalTransactions" in data
    assert "failedPayments" in data

@pytest.mark.asyncio
async def test_get_transactions():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/transactions/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

@pytest.mark.asyncio
async def test_simulation_and_recovery():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Simulate failure
        sim_payload = {
            "amountPaise": 25000,
            "paymentMethod": "UPI",
            "failureReason": "NETWORK_FAILURE",
            "customerId": "test_customer"
        }
        res_sim = await ac.post("/api/simulation/failure", json=sim_payload)
        assert res_sim.status_code == 200
        tx = res_sim.json()
        assert tx["state"] == "RECOVERABLE"
        tx_id = tx["id"]
        
        # Get transaction
        res_get = await ac.get(f"/api/transactions/{tx_id}")
        assert res_get.status_code == 200
        assert res_get.json()["id"] == tx_id
        
        # Recover transaction
        res_rec = await ac.post(f"/api/transactions/{tx_id}/recover")
        assert res_rec.status_code == 200
        assert res_rec.json()["state"] == "RECOVERED"
        assert res_rec.json()["recoveredAmountPaise"] == 25000

@pytest.mark.asyncio
async def test_invalid_transaction():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/transactions/invalid-id-does-not-exist")
        assert res.status_code == 404


@pytest.mark.asyncio
async def test_razorpay_invalid_signature_is_rejected(monkeypatch):
    monkeypatch.setenv("RAZORPAY_WEBHOOK_SECRET", "placeholder_webhook_secret_value")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post("/api/webhooks/razorpay", content=b"{}", headers={"x-razorpay-signature": "invalid"})
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_razorpay_webhook_is_idempotent(monkeypatch):
    secret = "placeholder_webhook_secret_value"
    monkeypatch.setenv("RAZORPAY_WEBHOOK_SECRET", secret)
    payment_id = f"pay_qa_{uuid.uuid4().hex}"
    payload = {
        "event": "payment.failed",
        "payload": {"payment": {"entity": {
            "id": payment_id, "amount": 25000, "method": "upi",
            "error_reason": "insufficient_funds", "order_id": "order_qa_idempotency",
        }}},
    }
    body = json.dumps(payload).encode()
    signature = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        first = await ac.post("/api/webhooks/razorpay", content=body, headers={"x-razorpay-signature": signature})
        second = await ac.post("/api/webhooks/razorpay", content=body, headers={"x-razorpay-signature": signature})
    assert first.status_code == 200
    assert first.json()["status"] == "processed"
    assert second.status_code == 200
    assert second.json()["status"] == "duplicate_ignored"
