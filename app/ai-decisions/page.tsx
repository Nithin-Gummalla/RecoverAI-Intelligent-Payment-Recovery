'use client';

import { Brain, Info, CheckCircle2, AlertTriangle, Shield } from 'lucide-react';
import { useAppState } from '@/lib/store';
import { RecoverabilityBadge, ActionBadge, PolicyBadge, FailureBadge, StateBadge } from '@/components/ui/Badges';
import { formatINR, formatDateTime } from '@/lib/utils';
import Link from 'next/link';

export default function AIDecisionsPage() {
  const { transactions } = useAppState();

  const decisionsData = transactions
    .filter(t => t.aiDiagnosis)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalDiagnosed = decisionsData.length;
  const policyRejected = decisionsData.filter(t => t.policyValidation?.decision === 'REJECTED').length;
  const policyModified = decisionsData.filter(t => t.policyValidation?.decision === 'MODIFIED').length;
  const highConfidence = decisionsData.filter(t => (t.aiDiagnosis?.confidencePercent ?? 0) >= 85).length;

  return (
    <div className="p-6 space-y-5 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">AI Decisions</h1>
          <p className="text-sm text-slate-500 mt-1">
            AI diagnosis output and policy validation results for all transactions
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
          <Info className="w-3.5 h-3.5" />
          DEMO DATA
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'AI Diagnoses', value: totalDiagnosed, color: 'text-blue-400' },
          { label: 'Policy Overrides', value: policyRejected, color: 'text-red-400', sub: 'AI rejected by policy' },
          { label: 'Policy Modifications', value: policyModified, color: 'text-amber-400', sub: 'Strategy modified' },
          { label: 'High Confidence (≥85%)', value: highConfidence, color: 'text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 border border-slate-800">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
            {s.sub && <div className="text-xs text-slate-700 mt-0.5">{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* Decision list */}
      <div className="space-y-3">
        {decisionsData.map(txn => {
          const ai = txn.aiDiagnosis!;
          const policy = txn.policyValidation;
          return (
            <div key={txn.id} className="glass-card p-5 border border-slate-800 hover:border-slate-700 transition-all">
              <div className="flex items-start gap-5">
                {/* Transaction info */}
                <div className="flex-shrink-0 w-48">
                  <Link href={`/transactions/${txn.id}`} className="text-sm font-mono text-blue-400 hover:text-blue-300 transition-colors">
                    {txn.id}
                  </Link>
                  <div className="text-xs text-slate-500 mt-1">{txn.customer.name}</div>
                  <div className="text-sm font-bold text-slate-300 mt-1">{formatINR(txn.amountPaise)}</div>
                  <div className="mt-1"><StateBadge state={txn.state} /></div>
                  <div className="text-xs text-slate-600 mt-1">{formatDateTime(txn.createdAt)}</div>
                </div>

                {/* AI section */}
                <div className="flex-1 border-l border-slate-800 pl-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide">AI Diagnosis</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <FailureBadge reason={ai.failureCategory} />
                    <RecoverabilityBadge level={ai.recoverability} />
                    <span className="text-xs text-slate-500">{ai.confidencePercent}% confidence</span>
                  </div>
                  <p className="text-xs text-slate-400">{ai.reason}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                    <span>Recommends: <ActionBadge action={ai.recommendedStrategy} /></span>
                    <span>Max retries: {ai.recommendedMaxRetries}</span>
                    <span>Fallback: <ActionBadge action={ai.fallbackStrategy} /></span>
                  </div>
                </div>

                {/* Policy section */}
                {policy && (
                  <div className="flex-shrink-0 w-52 border-l border-slate-800 pl-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">Policy</span>
                    </div>
                    <PolicyBadge decision={policy.decision} />
                    <div className="mt-2">
                      <span className="text-xs text-slate-500">Action: </span>
                      <ActionBadge action={policy.approvedAction} />
                    </div>
                    {policy.rejectionReason && (
                      <div className="mt-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded p-2">
                        {policy.rejectionReason.slice(0, 100)}...
                      </div>
                    )}
                    {policy.modificationReason && (
                      <div className="mt-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded p-2">
                        {policy.modificationReason.slice(0, 100)}...
                      </div>
                    )}
                    {policy.decision === 'APPROVED' && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        Within policy bounds
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {decisionsData.length === 0 && (
        <div className="glass-card p-12 border border-slate-800 text-center">
          <Brain className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No AI diagnoses yet. Run a simulation to see AI decisions.</p>
        </div>
      )}
    </div>
  );
}
