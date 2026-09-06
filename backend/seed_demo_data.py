import asyncio
import uuid
from datetime import datetime, timezone, timedelta
from app.database import engine, Base, AsyncSessionLocal
from app.models.transaction import Transaction, AuditLog, RecoveryAttempt, RecoveryPolicy

async def seed():
    # 1. Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    now = datetime.now(timezone.utc)
    
    async with AsyncSessionLocal() as session:
        # Seed Policy
        policy = RecoveryPolicy(
            id="policy_default",
            merchant_id="merchant_demo",
            max_retries=2,
            min_amount_for_auto_retry_paise=10000,
            max_amount_for_auto_recovery_paise=5000000,
            allowed_channels=["RETRY", "SEND_PAYMENT_LINK", "SEND_WHATSAPP"],
            stop_after_failures=2,
            retry_delay_minutes=15,
            enable_whatsapp=True,
            enable_voice=False
        )
        session.add(policy)

        # Transaction 1: RECOVERED
        t1_id = str(uuid.uuid4())
        t1 = Transaction(
            id=t1_id,
            amount_paise=450000,
            payment_method="UPI",
            failure_reason="NETWORK_FAILURE",
            failure_code="BAD_NETWORK",
            created_at=now - timedelta(hours=2),
            updated_at=now - timedelta(hours=1),
            state="RECOVERED",
            merchant_order_id="order_1",
            customer_id="cust_001",
            customer_name="Rahul Sharma",
            customer_email="rahul.sharma@gmail.com",
            customer_phone="+919876543210",
            recovered_amount_paise=450000,
            recovered_at=now - timedelta(hours=1),
            ai_diagnosis={
                "failureCategory": "NETWORK_FAILURE",
                "recoverability": "HIGH",
                "confidencePercent": 92,
                "reason": "Temporary network glitch detected. Historically 92% of these recover on immediate retry.",
                "recommendedStrategy": "RETRY",
                "recommendedMaxRetries": 3,
                "fallbackStrategy": "SEND_PAYMENT_LINK"
            }
        )
        session.add(t1)
        session.add(AuditLog(id=str(uuid.uuid4()), transaction_id=t1_id, timestamp=now-timedelta(hours=2), event="PAYMENT_FAILED", state="FAILED"))
        session.add(AuditLog(id=str(uuid.uuid4()), transaction_id=t1_id, timestamp=now-timedelta(hours=1), event="RECOVERY_SUCCESSFUL", state="RECOVERED"))

        # Transaction 2: STOPPED (Lost)
        t2_id = str(uuid.uuid4())
        t2 = Transaction(
            id=t2_id,
            amount_paise=150000,
            payment_method="CARD",
            failure_reason="EXPIRED_CARD",
            failure_code="CARD_EXPIRED",
            created_at=now - timedelta(days=1),
            updated_at=now - timedelta(days=1),
            state="STOPPED",
            merchant_order_id="order_2",
            customer_id="cust_002",
            customer_name="Priya Patel",
            customer_email="priya@example.com",
            customer_phone="+918765432109",
        )
        session.add(t2)
        session.add(AuditLog(id=str(uuid.uuid4()), transaction_id=t2_id, timestamp=now-timedelta(days=1), event="PAYMENT_FAILED", state="FAILED"))
        session.add(AuditLog(id=str(uuid.uuid4()), transaction_id=t2_id, timestamp=now-timedelta(days=1), event="RECOVERY_STOPPED", state="STOPPED"))

        # Transaction 3: WAITING_FOR_RESULT (At Risk)
        t3_id = str(uuid.uuid4())
        t3 = Transaction(
            id=t3_id,
            amount_paise=750000,
            payment_method="NET_BANKING",
            failure_reason="INSUFFICIENT_FUNDS",
            failure_code="NO_FUNDS",
            created_at=now - timedelta(minutes=10),
            updated_at=now - timedelta(minutes=5),
            state="WAITING_FOR_RESULT",
            merchant_order_id="order_3",
            customer_id="cust_003",
            customer_name="Amit Kumar",
            customer_email="amit@example.com",
            customer_phone="+917654321098",
        )
        session.add(t3)
        session.add(AuditLog(id=str(uuid.uuid4()), transaction_id=t3_id, timestamp=now-timedelta(minutes=10), event="PAYMENT_FAILED", state="FAILED"))
        session.add(AuditLog(id=str(uuid.uuid4()), transaction_id=t3_id, timestamp=now-timedelta(minutes=5), event="ACTION_EXECUTED", state="WAITING_FOR_RESULT"))
        session.add(RecoveryAttempt(id=str(uuid.uuid4()), transaction_id=t3_id, attempt_number=1, action="SEND_PAYMENT_LINK", result="PENDING", timestamp=now-timedelta(minutes=5)))

        await session.commit()
        print("Demo data seeded successfully.")

if __name__ == "__main__":
    asyncio.run(seed())
