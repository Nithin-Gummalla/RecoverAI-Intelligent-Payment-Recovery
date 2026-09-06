"""Credential-gated Razorpay Test Mode operations kept outside HTTP routes."""

import hashlib
import hmac
import os
from typing import Any

try:
    import razorpay
except ImportError:  # The app remains usable in simulation-only deployments.
    razorpay = None


class RazorpayConfigurationError(RuntimeError):
    pass


def is_enabled() -> bool:
    return bool(
        razorpay
        and os.getenv("RAZORPAY_MODE", "test").lower() == "test"
        and os.getenv("RAZORPAY_KEY_ID")
        and os.getenv("RAZORPAY_KEY_SECRET")
    )


def webhook_secret_configured() -> bool:
    return bool(os.getenv("RAZORPAY_WEBHOOK_SECRET"))


def verify_webhook_signature(raw_body: bytes, signature: str | None) -> bool:
    secret = os.getenv("RAZORPAY_WEBHOOK_SECRET")
    if not secret or not signature:
        return False
    expected = hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


def create_payment_link(*, amount_paise: int, reference_id: str, customer: dict[str, str]) -> dict[str, Any]:
    if not is_enabled():
        raise RazorpayConfigurationError("Razorpay Test Mode credentials are not configured.")
    client = razorpay.Client(auth=(os.environ["RAZORPAY_KEY_ID"], os.environ["RAZORPAY_KEY_SECRET"]))
    return client.payment_link.create({
        "amount": amount_paise,
        "currency": "INR",
        "reference_id": reference_id,
        "description": "RecoverAI payment recovery",
        "customer": customer,
        "notify": {"sms": True, "email": True},
        "reminder_enable": True,
    })
