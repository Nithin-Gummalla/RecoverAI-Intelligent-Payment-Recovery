from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from app.database import get_db
from app.models.transaction import RecoveryPolicy
from app.schemas.policy import RecoveryPolicySchema

router = APIRouter()

@router.get("/", response_model=List[RecoveryPolicySchema], response_model_by_alias=False)
async def get_policies(db: AsyncSession = Depends(get_db)):
    stmt = select(RecoveryPolicy)
    result = await db.execute(stmt)
    policies = result.scalars().all()
    return policies

@router.put("/", response_model=RecoveryPolicySchema, response_model_by_alias=False)
async def update_policy(policy_data: RecoveryPolicySchema, db: AsyncSession = Depends(get_db)):
    # Basic implementation, assuming one global policy for now
    stmt = select(RecoveryPolicy).limit(1)
    result = await db.execute(stmt)
    policy = result.scalars().first()
    
    if not policy:
        import uuid
        policy = RecoveryPolicy(id=str(uuid.uuid4()), merchant_id="demo_merchant")
        db.add(policy)
        
    for key, value in policy_data.model_dump(by_alias=False).items():
        if key not in {"id", "merchant_id"} and hasattr(policy, key):
            setattr(policy, key, value)
            
    await db.commit()
    await db.refresh(policy)
    return policy
