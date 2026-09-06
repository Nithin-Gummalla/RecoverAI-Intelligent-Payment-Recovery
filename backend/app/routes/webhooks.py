import hashlib
import json
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.transaction import AuditLog, RazorpayWebhookEvent
from app.services import recovery_service, razorpay_service

router = APIRouter()


def normalize_payment_failure(payload: dict) -> dict:
    payment = payload.get("payload", {}).get("payment", {}).get("entity", {})
    if not payment.get("id") or not payment.get("amount"):
        raise ValueError("Webhook does not contain a Razorpay payment entity.")
    method_map = {"upi": "UPI", "card": "CARD", "netbanking": "NET_BANKING", "wallet": "WALLET", "emi": "EMI"}
    reason_map = {
        "insufficient_funds": "INSUFFICIENT_FUNDS", "payment_timed_out": "TIMEOUT",
        "card_declined": "CARD_DECLINED", "authentication_failed": "AUTH_FAILURE",
    }
    raw_reason = str(payment.get("error_reason") or payment.get("error_code") or "UNKNOWN").lower()
    return {
        "payment_id": payment["id"],
        "amount_paise": int(payment["amount"]),
        "payment_method": method_map.get(str(payment.get("method", "")).lower(), "CARD"),
        "failure_reason": reason_map.get(raw_reason, "UNKNOWN"),
        "failure_code": str(payment.get("error_code") or "RAZORPAY_PAYMENT_FAILED"),
        "merchant_order_id": str(payment.get("order_id") or f"razorpay_{payment['id']}"),
        "customer_id": str(payment.get("customer_id") or payment["id"]),
        "customer_name": str(payment.get("notes", {}).get("customer_name") or "Razorpay Customer"),
        "customer_email": str(payment.get("email") or "unknown@razorpay.local"),
        "customer_phone": str(payment.get("contact") or ""),
    }


@router.post("/razorpay")
async def razorpay_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    raw_body = await request.body()
    signature = request.headers.get("x-razorpay-signature")
    if not razorpay_service.webhook_secret_configured():
        raise HTTPException(status_code=503, detail="Razorpay webhook secret is not configured")
    if not razorpay_service.verify_webhook_signature(raw_body, signature):
        raise HTTPException(status_code=401, detail="Invalid Razorpay webhook signature")
    try:
        event_payload = json.loads(raw_body)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="Invalid JSON payload") from exc

    if event_payload.get("event") != "payment.failed":
        return {"status": "ignored", "reason": "unsupported event"}
    try:
        normalized = normalize_payment_failure(event_payload)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    event_key = hashlib.sha256(f"payment.failed:{normalized['payment_id']}".encode()).hexdigest()
    existing = await db.get(RazorpayWebhookEvent, event_key)
    if existing:
        if existing.transaction_id and not existing.duplicate_logged:
            db.add(AuditLog(
                id=str(uuid.uuid4()), transaction_id=existing.transaction_id,
                event="RAZORPAY_EVENT_DUPLICATE_IGNORED", state="RECOVERABLE",
                actor="RAZORPAY_WEBHOOK", reason="Duplicate payment.failed webhook delivery",
            ))
            existing.duplicate_logged = True
            await db.commit()
        return {"status": "duplicate_ignored"}

    transaction_data = {**normalized, "razorpay_payment_id": normalized["payment_id"]}
    transaction_data.pop("payment_id")
    transaction = await recovery_service.simulate_failure(db=db, source="RAZORPAY", **transaction_data)
    db.add(RazorpayWebhookEvent(
        event_key=event_key, event_type="payment.failed", razorpay_payment_id=normalized["payment_id"],
        transaction_id=transaction.id,
    ))
    for event, actor in (("RAZORPAY_EVENT_RECEIVED", "RAZORPAY_WEBHOOK"), ("WEBHOOK_SIGNATURE_VERIFIED", "RAZORPAY_WEBHOOK"), ("RAZORPAY_FAILURE_DETECTED", "RAZORPAY_WEBHOOK")):
        db.add(AuditLog(id=str(uuid.uuid4()), transaction_id=transaction.id, event=event, state=transaction.state, actor=actor))
    await db.commit()
    return {"status": "processed", "transactionId": transaction.id}
