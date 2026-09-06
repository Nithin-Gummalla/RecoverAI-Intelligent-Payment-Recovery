'use client';

import {
  CreditCard, AlertTriangle, CheckCircle2, TrendingUp,
  DollarSign, ArrowUpRight, Clock, Zap, Info
} from 'lucide-react';
import { MetricCard, HeroMetricCard } from '@/components/dashboard/MetricCard';
import { FailureBreakdownChart } from '@/components/dashboard/FailureBreakdownChart';
import { RecoveryTrendChart } from '@/components/dashboard/RecoveryTrendChart';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { useAppState } from '@/lib/store';
import { formatINR } from '@/lib/utils';

export default function DashboardPage() {
  const { metrics, transactions } = useAppState();

  if (!metrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-400">Loading metrics...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Payment Recovery Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            AI-powered recovery intelligence · Deterministic execution
          </p>
        </div>
        {/* Demo label */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
          <Info className="w-3.5 h-3.5" />
          ⚠️ DEMO DATA — Simulated transactions for demonstration purposes only
        </div>
      </div>

      {/* Top metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">

        {/* Hero card — Revenue Recovered */}
        <div className="col-span-2 glass-card p-5 glow-green border border-emerald-500/20 metric-card">
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs font-semibold uppercase tracking-widest text-emerald-500">
              Revenue Recovered
            </div>
            <div className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <Zap className="w-3 h-3" />
              Live
            </div>
          </div>
          <div className="text-3xl font-black gradient-text-success mt-2">
            {formatINR(metrics.totalRevenueRecoveredPaise)}
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-500">Revenue Recovery Rate</span>
              <span className="font-bold text-emerald-400">{metrics.revenueRecoveryRatePercent}%</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(metrics.revenueRecoveryRatePercent, 100)}%` }}
              />
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-600">
            {formatINR(metrics.revenueAtRiskPaise)} actively at risk · {formatINR(metrics.totalRevenueLostPaise)} permanently lost
          </div>
        </div>

        <MetricCard
          title="Total Transactions"
          value={metrics.totalTransactions}
          icon={CreditCard}
          variant="default"
          trend={{ value: 12, label: 'vs last week' }}
        />

        <MetricCard
          title="Failed Payments"
          value={metrics.failedPayments}
          icon={AlertTriangle}
          variant="danger"
          subtitle={`${metrics.totalTransactions - metrics.failedPayments} succeeded`}
        />

        <MetricCard
          title="Successfully Recovered"
          value={metrics.successfullyRecovered}
          icon={CheckCircle2}
          variant="success"
          trend={{ value: 8, label: 'vs last week' }}
        />

        <MetricCard
          title="Recoverable"
          value={metrics.recoverablePayments}
          icon={TrendingUp}
          variant="purple"
          subtitle="AI classified as recoverable"
        />

        <MetricCard
          title="Revenue at Risk"
          value={metrics.revenueAtRiskPaise}
          isCurrency
          icon={DollarSign}
          variant="warning"
          subtitle="Currently active recovery attempts"
        />

        <MetricCard
          title="Avg Recovery Time"
          value={`${metrics.averageRecoveryTimeMinutes}m`}
          icon={Clock}
          variant="default"
          subtitle="From failure to recovered"
        />

        <MetricCard
          title="Transaction Recovery Rate"
          value={`${metrics.transactionRecoveryRatePercent}%`}
          icon={ArrowUpRight}
          variant="success"
          trend={{ value: 3.2, label: 'vs last week' }}
        />
      </div>

      {/* Strategy performance row */}
      {metrics.strategyPerformance.length > 0 && (
        <div className="glass-card p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-200">Recovery Strategy Performance</h3>
            <span className="text-xs text-slate-600">Calculated from session data</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metrics.strategyPerformance.map((strategy) => (
              <div key={strategy.action} className="bg-slate-900/60 rounded-lg p-4 border border-slate-800">
                <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">{strategy.action.replace(/_/g, ' ')}</div>
                <div className="text-lg font-bold text-slate-200">{strategy.recovered}/{strategy.attempts}</div>
                <div className="text-xs text-slate-400 mt-0.5">recovered</div>
                <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
                    style={{ width: `${strategy.successRate}%` }}
                  />
                </div>
                <div className="text-xs text-slate-500 mt-1">{strategy.successRate}% success rate</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FailureBreakdownChart data={metrics.failureBreakdown} />
        <RecoveryTrendChart data={metrics.recoveryTrend} />
      </div>

      {/* Recent transactions */}
      <RecentTransactions transactions={transactions} />

    </div>
  );
}
