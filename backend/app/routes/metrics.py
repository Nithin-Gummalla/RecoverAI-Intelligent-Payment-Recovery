from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services import metrics_service
from typing import Dict, Any

router = APIRouter()

@router.get("/", response_model=Dict[str, Any])
async def get_metrics(db: AsyncSession = Depends(get_db)):
    return await metrics_service.compute_dashboard_metrics(db)
