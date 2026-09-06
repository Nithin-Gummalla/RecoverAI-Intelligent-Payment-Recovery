from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.models.transaction import Transaction, AuditLog
import uuid
from datetime import datetime, timezone

async def get_all_transactions(db: AsyncSession):
    stmt = select(Transaction).order_by(Transaction.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()

async def get_transaction(db: AsyncSession, transaction_id: str):
    stmt = select(Transaction).options(
        selectinload(Transaction.audit_logs),
        selectinload(Transaction.recovery_attempts)
    ).where(Transaction.id == transaction_id)
    result = await db.execute(stmt)
    return result.scalars().first()

async def create_audit_log(db: AsyncSession, transaction_id: str, event: str, state: str, actor: str = "SYSTEM", action: str = None, reason: str = None):
    log = AuditLog(
        id=str(uuid.uuid4()),
        transaction_id=transaction_id,
        event=event,
        state=state,
        actor=actor,
        action=action,
        reason=reason,
        timestamp=datetime.now(timezone.utc)
    )
    db.add(log)
    return log
