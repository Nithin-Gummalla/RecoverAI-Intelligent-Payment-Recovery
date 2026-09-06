from sqlalchemy.ext.asyncio import AsyncSession
from app.models.transaction import Transaction, AuditLog, RecoveryAttempt, RecoveryPolicy
from app.recovery.ai_diagnosis import generate_ai_diagnosis
import uuid
from datetime import datetime, timezone

async def simulate_failure(
    db: AsyncSession, amount_paise: int, payment_method: str, failure_reason: str, customer_id: str,
    source: str = "SIMULATION", razorpay_payment_id: str | None = None,
    failure_code: str = "E1001", merchant_order_id: str | None = None,
    customer_name: str = "Demo Customer", customer_email: str = "demo@example.com", customer_phone: str = "+919876543210",
):
    # 1. Create a FAILED transaction
    now = datetime.now(timezone.utc)
    transaction = Transaction(
        id=str(uuid.uuid4()),
        amount_paise=amount_paise,
        payment_method=payment_method,
        failure_reason=failure_reason,
        failure_code=failure_code,
        state="FAILED",
        merchant_order_id=merchant_order_id or f"order_{uuid.uuid4().hex[:8]}",
        razorpay_payment_id=razorpay_payment_id,
        source=source,
        customer_id=customer_id,
        customer_name=customer_name,
        customer_email=customer_email,
        customer_phone=customer_phone,
        created_at=now,
        updated_at=now
    )
    db.add(transaction)
    await db.flush()

    # 3. Create initial audit log
    db.add(AuditLog(
        id=str(uuid.uuid4()),
        transaction_id=transaction.id,
        event="PAYMENT_FAILED",
        state="FAILED",
        actor="RAZORPAY_WEBHOOK" if source == "RAZORPAY" else "SYSTEM",
        reason=failure_reason,
        timestamp=datetime.now(timezone.utc)
    ))

    # Transition to DIAGNOSING
    transaction.state = "DIAGNOSING"
    transaction.updated_at = datetime.now(timezone.utc)
    db.add(AuditLog(
        id=str(uuid.uuid4()),
        transaction_id=transaction.id,
        event="DIAGNOSIS_STARTED",
        state="DIAGNOSING",
        actor="RAZORPAY_WEBHOOK" if source == "RAZORPAY" else "SYSTEM",
        timestamp=datetime.now(timezone.utc)
    ))
    
    # Run deterministic logic
    txn_dict = {
        "failure_reason": failure_reason,
        "payment_method": payment_method,
        "amount_paise": amount_paise,
    }
    diagnosis = await generate_ai_diagnosis(txn_dict)
    transaction.ai_diagnosis = diagnosis
    
    # Determine recoverability
    if diagnosis["recoverability"] == "HIGH" or diagnosis["recoverability"] == "MEDIUM":
        transaction.state = "RECOVERABLE"
    else:
        transaction.state = "NON_RECOVERABLE"
        
    db.add(AuditLog(
        id=str(uuid.uuid4()),
        transaction_id=transaction.id,
        event="DIAGNOSIS_COMPLETED",
        state=transaction.state,
        actor="AI_ENGINE",
        ai_decision=diagnosis["recommendedStrategy"],
        reason=diagnosis["reason"],
        timestamp=datetime.now(timezone.utc)
    ))

    # Commit the transaction so far
    await db.commit()
    await db.refresh(transaction)
    return transaction

async def execute_recovery(db: AsyncSession, transaction_id: str):
    from sqlalchemy.future import select
    from sqlalchemy.orm import selectinload
    stmt = select(Transaction).options(
        selectinload(Transaction.audit_logs),
        selectinload(Transaction.recovery_attempts)
    ).where(Transaction.id == transaction_id)
    result = await db.execute(stmt)
    transaction = result.scalars().first()
    
    if not transaction:
        raise ValueError("Transaction not found")
        
    if transaction.state != "RECOVERABLE":
        raise ValueError("Transaction is not in a recoverable state")

    policy_result = await db.execute(select(RecoveryPolicy).limit(1))
    policy = policy_result.scalars().first()
    diagnosis = transaction.ai_diagnosis or {}
    recommended_action = diagnosis.get("recommendedStrategy", "STOP")
    approved_action = recommended_action
    decision = "APPROVED"
    reason = None

    if not policy:
        approved_action = "STOP"
        decision = "REJECTED"
        reason = "No recovery policy is configured."
    elif transaction.amount_paise > policy.max_amount_for_auto_recovery_paise:
        approved_action = "STOP"
        decision = "REJECTED"
        reason = "Transaction amount exceeds the auto-recovery limit."
    elif recommended_action == "RETRY" and transaction.amount_paise < policy.min_amount_for_auto_retry_paise:
        approved_action = "STOP"
        decision = "REJECTED"
        reason = "Transaction amount is below the auto-retry minimum."
    elif recommended_action == "SEND_WHATSAPP" and not policy.enable_whatsapp:
        approved_action = "STOP"
        decision = "REJECTED"
        reason = "WhatsApp recovery is disabled by policy."
    elif recommended_action == "VOICE_CONTACT" and not policy.enable_voice:
        approved_action = "STOP"
        decision = "REJECTED"
        reason = "Voice recovery is disabled by policy."
    elif recommended_action not in policy.allowed_channels:
        fallback = diagnosis.get("fallbackStrategy", "STOP")
        approved_action = fallback if fallback in policy.allowed_channels else "STOP"
        decision = "MODIFIED" if approved_action != "STOP" else "REJECTED"
        reason = "Recommended recovery channel is not allowed by policy."

    transaction.policy_validation = {
        "decision": decision,
        "approvedAction": approved_action,
        "rejectionReason": reason if decision == "REJECTED" else None,
        "modificationReason": reason if decision == "MODIFIED" else None,
        "appliedMaxRetries": min(diagnosis.get("recommendedMaxRetries", 0), policy.max_retries if policy else 0),
    }
    db.add(AuditLog(
        id=str(uuid.uuid4()),
        transaction_id=transaction.id,
        event="POLICY_VALIDATED",
        state="STRATEGY_SELECTED" if approved_action != "STOP" else "STOPPED",
        actor="POLICY_ENGINE",
        ai_decision=recommended_action,
        policy_decision=decision,
        action=approved_action,
        reason=reason,
        timestamp=datetime.now(timezone.utc),
    ))

    if approved_action == "STOP":
        transaction.state = "STOPPED"
        db.add(AuditLog(
            id=str(uuid.uuid4()), transaction_id=transaction.id,
            event="RECOVERY_STOPPED", state="STOPPED", actor="POLICY_ENGINE",
            reason=reason, timestamp=datetime.now(timezone.utc),
        ))
        await db.commit()
        await db.refresh(transaction)
        return transaction

    transaction.state = "STRATEGY_SELECTED"
    db.add(AuditLog(
        id=str(uuid.uuid4()),
        transaction_id=transaction.id,
        event="STRATEGY_SELECTED",
        state=transaction.state,
        actor="SYSTEM",
        action=approved_action,
        timestamp=datetime.now(timezone.utc)
    ))
    
    transaction.state = "ACTION_EXECUTED"
    action = approved_action

    if action == "SEND_PAYMENT_LINK":
        from app.services import razorpay_service
        db.add(AuditLog(
            id=str(uuid.uuid4()), transaction_id=transaction.id,
            event="PAYMENT_LINK_REQUESTED", state=transaction.state,
            actor="SYSTEM", action=action, timestamp=datetime.now(timezone.utc),
        ))
        if razorpay_service.is_enabled():
            try:
                payment_link = razorpay_service.create_payment_link(
                    amount_paise=transaction.amount_paise,
                    reference_id=transaction.id,
                    customer={"name": transaction.customer_name, "email": transaction.customer_email, "contact": transaction.customer_phone},
                )
                transaction.razorpay_payment_link_id = payment_link.get("id")
                transaction.razorpay_payment_link_url = payment_link.get("short_url")
                transaction.state = "WAITING_FOR_RESULT"
                db.add(RecoveryAttempt(
                    id=str(uuid.uuid4()), transaction_id=transaction.id,
                    attempt_number=len(transaction.recovery_attempts) + 1, action=action,
                    timestamp=datetime.now(timezone.utc), result="PENDING",
                    reason="Razorpay Payment Link created; awaiting customer payment.",
                ))
                db.add(AuditLog(
                    id=str(uuid.uuid4()), transaction_id=transaction.id,
                    event="PAYMENT_LINK_CREATED", state=transaction.state, actor="RAZORPAY",
                    action=action, result=transaction.razorpay_payment_link_id, timestamp=datetime.now(timezone.utc),
                ))
                await db.commit()
                await db.refresh(transaction)
                return transaction
            except Exception as exc:
                transaction.state = "FAILED_AGAIN"
                db.add(AuditLog(
                    id=str(uuid.uuid4()), transaction_id=transaction.id,
                    event="PAYMENT_LINK_FAILED", state=transaction.state, actor="RAZORPAY",
                    action=action, reason=str(exc), timestamp=datetime.now(timezone.utc),
                ))
                await db.commit()
                await db.refresh(transaction)
                return transaction
        db.add(AuditLog(
            id=str(uuid.uuid4()), transaction_id=transaction.id,
            event="PAYMENT_LINK_SIMULATED", state=transaction.state, actor="SYSTEM",
            action=action, reason="Razorpay Test Mode credentials are not configured.", timestamp=datetime.now(timezone.utc),
        ))
    
    db.add(RecoveryAttempt(
        id=str(uuid.uuid4()),
        transaction_id=transaction.id,
        attempt_number=len(transaction.recovery_attempts) + 1,
        action=action,
        timestamp=datetime.now(timezone.utc),
        result="SUCCESS" if action != "STOP" else "FAILED",
    ))
    
    db.add(AuditLog(
        id=str(uuid.uuid4()),
        transaction_id=transaction.id,
        event="ACTION_EXECUTED",
        state=transaction.state,
        actor="SYSTEM",
        action=action,
        timestamp=datetime.now(timezone.utc)
    ))
    
    transaction.state = "WAITING_FOR_RESULT"
    
    # Simulate immediate success for demo if action is RETRY or we just assume success for now
    if action != "STOP":
        transaction.state = "RECOVERED"
        transaction.recovered_amount_paise = transaction.amount_paise
        transaction.recovered_at = datetime.now(timezone.utc)
    else:
        transaction.state = "STOPPED"
        
    db.add(AuditLog(
        id=str(uuid.uuid4()),
        transaction_id=transaction.id,
        event="RECOVERY_SUCCESSFUL" if transaction.state == "RECOVERED" else "RECOVERY_STOPPED",
        state=transaction.state,
        actor="SYSTEM",
        timestamp=datetime.now(timezone.utc)
    ))
    
    await db.commit()
    await db.refresh(transaction)
    return transaction
