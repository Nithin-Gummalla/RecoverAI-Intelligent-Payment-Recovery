from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.transaction import SimulateFailureRequest, TransactionSchema
from app.services import recovery_service
from app.routes.transactions import get_transaction

router = APIRouter()

@router.post("/failure", response_model=TransactionSchema, response_model_by_alias=False)
async def simulate_failure(request: SimulateFailureRequest, db: AsyncSession = Depends(get_db)):
    transaction = await recovery_service.simulate_failure(
        db=db,
        amount_paise=request.amountPaise,
        payment_method=request.paymentMethod,
        failure_reason=request.failureReason,
        customer_id=request.customerId
    )
    # Fetch full nested representation using the route logic
    return await get_transaction(transaction.id, db)
