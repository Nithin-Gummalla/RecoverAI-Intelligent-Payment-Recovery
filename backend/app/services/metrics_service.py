from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.models.transaction import Transaction, RecoveryAttempt
from typing import Dict, Any
from datetime import datetime, timedelta, timezone

async def compute_dashboard_metrics(db: AsyncSession) -> Dict[str, Any]:
    # Fetch all transactions to compute metrics
    stmt = select(Transaction)
    result = await db.execute(stmt)
    transactions = result.scalars().all()
    
    total_transactions = len(transactions)
    failed_payments = total_transactions  # For this demo, all generated transactions are failures
    
    successfully_recovered = sum(1 for t in transactions if t.state == 'RECOVERED')
    active_states = {'FAILED', 'DIAGNOSING', 'RECOVERABLE', 'STRATEGY_SELECTED', 'ACTION_EXECUTED', 'WAITING_FOR_RESULT'}
    recoverable_payments = sum(1 for t in transactions if t.state in active_states)
    
    total_revenue_lost_paise = sum(t.amount_paise for t in transactions if t.state in ['STOPPED', 'NON_RECOVERABLE'])
    total_revenue_recovered_paise = sum(t.recovered_amount_paise for t in transactions if t.state == 'RECOVERED' and t.recovered_amount_paise)
    
    active_revenue_at_risk_paise = sum(t.amount_paise for t in transactions if t.state not in ['RECOVERED', 'STOPPED', 'NON_RECOVERABLE'])
    
    transaction_recovery_rate = (successfully_recovered / failed_payments * 100) if failed_payments > 0 else 0
    
    total_failed_revenue = total_revenue_recovered_paise + active_revenue_at_risk_paise + total_revenue_lost_paise
    revenue_recovery_rate = (total_revenue_recovered_paise / total_failed_revenue * 100) if total_failed_revenue > 0 else 0
    
    # Calculate average recovery time
    recovery_times = []
    for t in transactions:
        if t.state == 'RECOVERED' and t.recovered_at and t.created_at:
            delta = (t.recovered_at - t.created_at).total_seconds() / 60
            recovery_times.append(delta)
    avg_recovery_time = sum(recovery_times) / len(recovery_times) if recovery_times else 0

    # Failure breakdown
    failure_breakdown = {}
    for t in transactions:
        failure_breakdown[t.failure_reason] = failure_breakdown.get(t.failure_reason, 0) + 1

    # Strategy performance
    stmt_attempts = select(RecoveryAttempt)
    attempts_result = await db.execute(stmt_attempts)
    attempts = attempts_result.scalars().all()
    
    strategy_counts = {}
    for a in attempts:
        if a.action not in strategy_counts:
            strategy_counts[a.action] = {"attempts": 0, "recovered": 0}
        strategy_counts[a.action]["attempts"] += 1
        if a.result == "SUCCESS":
            strategy_counts[a.action]["recovered"] += 1
            
    strategy_performance = []
    for action, stats in strategy_counts.items():
        success_rate = (stats["recovered"] / stats["attempts"] * 100) if stats["attempts"] > 0 else 0
        strategy_performance.append({
            "action": action,
            "attempts": stats["attempts"],
            "recovered": stats["recovered"],
            "successRate": success_rate
        })
        
    trend_by_day = {}
    for days_ago in range(6, -1, -1):
        day = (datetime.now(timezone.utc) - timedelta(days=days_ago)).date().isoformat()
        trend_by_day[day] = {
            "date": day,
            "failed": 0,
            "recovered": 0,
            "revenueLostPaise": 0,
            "revenueRecoveredPaise": 0,
        }
    for transaction in transactions:
        if not transaction.created_at:
            continue
        day = transaction.created_at.astimezone(timezone.utc).date().isoformat()
        if day not in trend_by_day:
            continue
        bucket = trend_by_day[day]
        bucket["failed"] += 1
        if transaction.state == 'RECOVERED':
            bucket["recovered"] += 1
            bucket["revenueRecoveredPaise"] += transaction.recovered_amount_paise or 0
        elif transaction.state in ['STOPPED', 'NON_RECOVERABLE']:
            bucket["revenueLostPaise"] += transaction.amount_paise

    return {
        "totalTransactions": total_transactions,
        "failedPayments": failed_payments,
        "recoverablePayments": recoverable_payments,
        "successfullyRecovered": successfully_recovered,
        "totalRevenueLostPaise": total_revenue_lost_paise,
        "totalRevenueRecoveredPaise": total_revenue_recovered_paise,
        "revenueAtRiskPaise": active_revenue_at_risk_paise,
        "transactionRecoveryRatePercent": transaction_recovery_rate,
        "revenueRecoveryRatePercent": revenue_recovery_rate,
        "averageRecoveryTimeMinutes": avg_recovery_time,
        "failureBreakdown": failure_breakdown,
        "strategyPerformance": strategy_performance,
        "recoveryTrend": list(trend_by_day.values())
    }
