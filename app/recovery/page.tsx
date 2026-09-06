'use client';

import { RefreshCw, TrendingUp, CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';
import { useAppState } from '@/lib/store';
import { StateBadge, ActionBadge, RecoverabilityBadge } from '@/components/ui/Badges';
import { formatINR, formatRelativeTime, RECOVERY_ACTION_LABELS } from '@/lib/utils';
import Link from 'next/link';

export default function RecoveryPage() {
  const { transactions } = useAppState();

  const active = transactions.filter(t =>
    ['FAILED', 'DIAGNOSING', 'RECOVERABLE', 'STRATEGY_SELECTED', 'ACTION_EXECUTED', 'WAITING_FOR_RESULT'].includes(t.state)
  );
  const recovered = transactions.filter(t => t.state === 'RECOVERED');
  const stopped = transactions.filter(t => t.state === 'STOPPED' || t.state === 'NON_RECOVERABLE');

  return (
    <div className="p-6 space-y-5 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Recovery Center</h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor and manage all active payment recovery operations
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
          <Info className="w-3.5 h-3.5" />
          DEMO DATA
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-4 border border-yellow-500/20 bg-yellow-500/5">
          <div className="flex items-center gap-2 mb-2">
            <RefreshCw className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-semibold text-yellow-400 uppercase tracking-wide">Active Recovery</span>
          </div>
          <div className="text-2xl font-bold text-yellow-300">{active.length}</div>
          <div className="text-xs text-slate-500 mt-1">Transactions in progress</div>
        </div>
        <div className="glass-card p-4 border border-emerald-500/20 bg-emerald-500/5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">Recovered</span>
          </div>
          <div className="text-2xl font-bold text-emerald-300">{recovered.length}</div>
          <div className="text-xs text-slate-500 mt-1">{formatINR(recovered.reduce((s, t) => s + (t.recoveredAmountPaise ?? 0), 0))} recovered</div>
        </div>
        <div className="glass-card p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Stopped</span>
          </div>
          <div className="text-2xl font-bold text-slate-400">{stopped.length}</div>
          <div className="text-xs text-slate-500 mt-1">Unrecoverable or policy stopped</div>
        </div>
      </div>

      {/* Active recoveries */}
      {active.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 text-yellow-400" />
            Active Recovery Operations
          </h2>
          <div className="space-y-2">
            {active.map(txn => (
              <Link key={txn.id} href={`/transactions/${txn.id}`} className="block">
                <div className="glass-card p-4 border border-slate-800 hover:border-slate-700 transition-all flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-blue-400">{txn.id}</span>
                      <StateBadge state={txn.state} />
                    </div>
                    <div className="text-sm font-medium text-slate-300 mt-1">{txn.customer.name}</div>
                    <div className="text-xs text-slate-500">{formatRelativeTime(txn.createdAt)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-slate-200">{formatINR(txn.amountPaise)}</div>
                    {txn.aiDiagnosis && <RecoverabilityBadge level={txn.aiDiagnosis.recoverability} />}
                  </div>
                  <div className="text-xs text-slate-600">→</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recovered */}
      {recovered.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Successfully Recovered
          </h2>
          <div className="space-y-2">
            {recovered.map(txn => (
              <Link key={txn.id} href={`/transactions/${txn.id}`} className="block">
                <div className="glass-card p-4 border border-emerald-500/15 hover:border-emerald-500/30 transition-all flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-emerald-400">{txn.id}</span>
                      <StateBadge state={txn.state} />
                    </div>
                    <div className="text-sm font-medium text-slate-300 mt-1">{txn.customer.name}</div>
                    {txn.policyValidation && (
                      <div className="text-xs text-slate-500 mt-0.5">
                        via <ActionBadge action={txn.policyValidation.approvedAction} />
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-emerald-400">↩ {formatINR(txn.recoveredAmountPaise ?? txn.amountPaise)}</div>
                    <div className="text-xs text-slate-500">{txn.recoveredAt ? formatRelativeTime(txn.recoveredAt) : ''}</div>
                  </div>
                  <div className="text-xs text-slate-600">→</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {transactions.length === 0 && (
        <div className="glass-card p-12 border border-slate-800 text-center">
          <TrendingUp className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No transactions yet. Run a simulation to begin.</p>
        </div>
      )}
    </div>
  );
}
