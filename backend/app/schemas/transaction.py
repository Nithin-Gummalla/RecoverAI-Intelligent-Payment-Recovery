from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from datetime import datetime

class AuditLogSchema(BaseModel):
    id: str
    transactionId: str = Field(alias="transaction_id")
    timestamp: datetime
    event: str
    state: str
    actor: Optional[str] = None
    action: Optional[str] = None
    reason: Optional[str] = None
    aiDecision: Optional[str] = Field(None, alias="ai_decision")
    policyDecision: Optional[str] = Field(None, alias="policy_decision")
    result: Optional[str] = None

    class Config:
        from_attributes = True
        populate_by_name = True

class RecoveryAttemptSchema(BaseModel):
    id: str
    transactionId: str = Field(alias="transaction_id")
    attemptNumber: int = Field(alias="attempt_number")
    action: str
    timestamp: datetime
    result: str
    reason: Optional[str] = None

    class Config:
        from_attributes = True
        populate_by_name = True

class CustomerSchema(BaseModel):
    id: str
    name: str
    email: str
    phone: str

class TransactionSchema(BaseModel):
    id: str
    amountPaise: int = Field(alias="amount_paise")
    paymentMethod: str = Field(alias="payment_method")
    failureReason: str = Field(alias="failure_reason")
    failureCode: str = Field(alias="failure_code")
    createdAt: datetime = Field(alias="created_at")
    updatedAt: datetime = Field(alias="updated_at")
    state: str
    merchantOrderId: str = Field(alias="merchant_order_id")
    razorpayPaymentId: Optional[str] = Field(None, alias="razorpay_payment_id")
    source: str = "SIMULATION"
    razorpayPaymentLinkId: Optional[str] = Field(None, alias="razorpay_payment_link_id")
    razorpayPaymentLinkUrl: Optional[str] = Field(None, alias="razorpay_payment_link_url")
    
    # Nested customer structured for the frontend
    customer: CustomerSchema

    aiDiagnosis: Optional[Dict[str, Any]] = Field(None, alias="ai_diagnosis")
    policyValidation: Optional[Dict[str, Any]] = Field(None, alias="policy_validation")
    
    recoveredAmountPaise: Optional[int] = Field(None, alias="recovered_amount_paise")
    recoveredAt: Optional[datetime] = Field(None, alias="recovered_at")

    recoveryAttempts: List[RecoveryAttemptSchema] = Field(default_factory=list, alias="recovery_attempts")
    auditLog: List[AuditLogSchema] = Field(default_factory=list, alias="audit_logs")

    class Config:
        from_attributes = True
        populate_by_name = True

class SimulateFailureRequest(BaseModel):
    amountPaise: int
    paymentMethod: str
    failureReason: str
    customerId: str
