from sqlalchemy import Column, String, Integer, BigInteger, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from app.database import Base

class Transaction(Base):
    __tablename__ = 'transactions'

    id = Column(String, primary_key=True, index=True)
    amount_paise = Column(BigInteger, nullable=False)
    payment_method = Column(String, nullable=False)
    failure_reason = Column(String, nullable=False)
    failure_code = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    state = Column(String, nullable=False)
    merchant_order_id = Column(String, nullable=False)
    razorpay_payment_id = Column(String, nullable=True)
    source = Column(String, nullable=False, default="SIMULATION")
    razorpay_payment_link_id = Column(String, nullable=True)
    razorpay_payment_link_url = Column(String, nullable=True)
    
    # Nested customer fields for simplicity instead of a separate table for demo
    customer_id = Column(String, nullable=False)
    customer_name = Column(String, nullable=False)
    customer_email = Column(String, nullable=False)
    customer_phone = Column(String, nullable=False)

    # Recovery data (stored as JSON for flexibility, mimicking NoSQL documents for these structured objects)
    ai_diagnosis = Column(JSON, nullable=True)
    policy_validation = Column(JSON, nullable=True)
    
    recovered_amount_paise = Column(BigInteger, nullable=True)
    recovered_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    recovery_attempts = relationship("RecoveryAttempt", back_populates="transaction", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="transaction", cascade="all, delete-orphan", order_by="desc(AuditLog.timestamp)")


class AuditLog(Base):
    __tablename__ = 'audit_logs'

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    transaction_id = Column(String, ForeignKey('transactions.id'), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    event = Column(String, nullable=False)
    state = Column(String, nullable=False)
    actor = Column(String, nullable=True)
    action = Column(String, nullable=True)
    reason = Column(String, nullable=True)
    ai_decision = Column(String, nullable=True)
    policy_decision = Column(String, nullable=True)
    result = Column(String, nullable=True)

    transaction = relationship("Transaction", back_populates="audit_logs")


class RecoveryAttempt(Base):
    __tablename__ = 'recovery_attempts'

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    transaction_id = Column(String, ForeignKey('transactions.id'), nullable=False, index=True)
    attempt_number = Column(Integer, nullable=False)
    action = Column(String, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    result = Column(String, nullable=False)
    reason = Column(String, nullable=True)

    transaction = relationship("Transaction", back_populates="recovery_attempts")


class RecoveryPolicy(Base):
    __tablename__ = 'recovery_policies'

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    merchant_id = Column(String, index=True, nullable=False)
    max_retries = Column(Integer, default=3)
    min_amount_for_auto_retry_paise = Column(BigInteger, default=0)
    max_amount_for_auto_recovery_paise = Column(BigInteger, default=1000000)
    allowed_channels = Column(JSON, default=list) # List of allowed action strings
    stop_after_failures = Column(Integer, default=3)
    retry_delay_minutes = Column(Integer, default=15)
    enable_whatsapp = Column(Boolean, default=True)
    enable_voice = Column(Boolean, default=False)


class RazorpayWebhookEvent(Base):
    __tablename__ = 'razorpay_webhook_events'

    event_key = Column(String, primary_key=True)
    event_type = Column(String, nullable=False)
    razorpay_payment_id = Column(String, nullable=False, index=True)
    transaction_id = Column(String, ForeignKey('transactions.id'), nullable=True)
    duplicate_logged = Column(Boolean, nullable=False, default=False)
    received_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
