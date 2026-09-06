from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database import get_db
from app.schemas.transaction import TransactionSchema
from app.services import transaction_service

router = APIRouter()

@router.get("/", response_model=List[TransactionSchema], response_model_by_alias=False)
async def list_transactions(db: AsyncSession = Depends(get_db)):
    transactions = await transaction_service.get_all_transactions(db)
    # The frontend expects 'customer' as a nested object. We map the flat fields to the nested structure.
    # We can do this at the Pydantic level or manual translation before return.
    # Let's map it here to match Pydantic expectations.
    formatted = []
    for t in transactions:
        t_dict = {
            "id": t.id,
            "amount_paise": t.amount_paise,
            "payment_method": t.payment_method,
            "failure_reason": t.failure_reason,
            "failure_code": t.failure_code,
            "created_at": t.created_at,
            "updated_at": t.updated_at,
            "state": t.state,
            "merchant_order_id": t.merchant_order_id,
            "razorpay_payment_id": t.razorpay_payment_id,
            "source": t.source,
            "razorpay_payment_link_id": t.razorpay_payment_link_id,
            "razorpay_payment_link_url": t.razorpay_payment_link_url,
            "customer": {
                "id": t.customer_id,
                "name": t.customer_name,
                "email": t.customer_email,
                "phone": t.customer_phone,
            },
            "ai_diagnosis": t.ai_diagnosis,
            "policy_validation": t.policy_validation,
            "recovered_amount_paise": t.recovered_amount_paise,
            "recovered_at": t.recovered_at,
            "recovery_attempts": [],
            "audit_logs": []
        }
        formatted.append(t_dict)
    return formatted

@router.get("/{id}", response_model=TransactionSchema, response_model_by_alias=False)
async def get_transaction(id: str, db: AsyncSession = Depends(get_db)):
    t = await transaction_service.get_transaction(db, id)
    if not t:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    t_dict = {
        "id": t.id,
        "amount_paise": t.amount_paise,
        "payment_method": t.payment_method,
        "failure_reason": t.failure_reason,
        "failure_code": t.failure_code,
        "created_at": t.created_at,
        "updated_at": t.updated_at,
        "state": t.state,
        "merchant_order_id": t.merchant_order_id,
        "razorpay_payment_id": t.razorpay_payment_id,
        "source": t.source,
        "razorpay_payment_link_id": t.razorpay_payment_link_id,
        "razorpay_payment_link_url": t.razorpay_payment_link_url,
        "customer": {
            "id": t.customer_id,
            "name": t.customer_name,
            "email": t.customer_email,
            "phone": t.customer_phone,
        },
        "ai_diagnosis": t.ai_diagnosis,
        "policy_validation": t.policy_validation,
        "recovered_amount_paise": t.recovered_amount_paise,
        "recovered_at": t.recovered_at,
        "recovery_attempts": [ra.__dict__ for ra in t.recovery_attempts],
        "audit_logs": [al.__dict__ for al in t.audit_logs]
    }
    return t_dict

@router.post("/{id}/recover", response_model=TransactionSchema, response_model_by_alias=False)
async def recover_transaction(id: str, db: AsyncSession = Depends(get_db)):
    from app.services import recovery_service
    try:
        await recovery_service.execute_recovery(db, id)
    except ValueError as exc:
        status_code = 404 if str(exc) == "Transaction not found" else 409
        raise HTTPException(status_code=status_code, detail=str(exc)) from exc
    return await get_transaction(id, db)
