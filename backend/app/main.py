from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.database import engine, Base
from app.models import transaction as transaction_models

from app.routes import transactions, simulation, metrics, audit, policies, webhooks

app = FastAPI(title="RecoverAI Backend")

# Allow local Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(transactions.router, prefix="/api/transactions", tags=["transactions"])
app.include_router(simulation.router, prefix="/api/simulation", tags=["simulation"])
app.include_router(metrics.router, prefix="/api/metrics", tags=["metrics"])
app.include_router(audit.router, prefix="/api/audit-logs", tags=["audit"])
app.include_router(policies.router, prefix="/api/policies", tags=["policies"])
app.include_router(webhooks.router, prefix="/api/webhooks", tags=["webhooks"])

@app.on_event("startup")
async def ensure_razorpay_schema():
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
        await connection.execute(text("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS source VARCHAR NOT NULL DEFAULT 'SIMULATION'"))
        await connection.execute(text("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS razorpay_payment_link_id VARCHAR"))
        await connection.execute(text("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS razorpay_payment_link_url VARCHAR"))

@app.get("/")
def read_root():
    return {"message": "Welcome to RecoverAI API"}
