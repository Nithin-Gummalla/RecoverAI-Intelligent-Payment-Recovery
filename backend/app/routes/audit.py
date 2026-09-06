from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from app.database import get_db
from app.models.transaction import AuditLog
from app.schemas.transaction import AuditLogSchema

router = APIRouter()

@router.get("/", response_model=List[AuditLogSchema], response_model_by_alias=False)
async def list_audit_logs(db: AsyncSession = Depends(get_db)):
    stmt = select(AuditLog).order_by(AuditLog.timestamp.desc())
    result = await db.execute(stmt)
    logs = result.scalars().all()
    return logs
