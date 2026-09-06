'use client';

import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Shield, Brain } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Transaction } from '@/lib/types';
import {
  StateBadge, FailureBadge, PaymentMethodBadge,
  RecoverabilityBadge, ActionBadge, PolicyBadge
} from '@/components/ui/Badges';
import { formatINR, formatDateTime, RECOVERY_ACTION_LABELS } from '@/lib/utils';
import { clsx } from 'clsx';

export default function TransactionDetailPage() {
  const params = useParams();
  const [whyExpanded, setWhyExpanded] = useState(false);
  const [txn, setTxn] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTxn() {
      if (!params.id) return;
      try {
        const data = await api.getTransaction(params.id as string);
        setTxn(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadTxn();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-400">Loading transaction...</div>
      </div>
    );
  }

  if (!txn) return notFound();

  const { customer, aiDiagnosis, policyValidation, auditLog, recoveryAttempts } = txn;
  const isPolicyRejected = policyValidation?.decision === 'REJECTED';
  const isPolicyModified = policyValidation?.decision === 'MODIFIED';

  return (
    <div className="p-6 space-y-5 max-w-[1100px] mx-auto">

      {/* Back + header */}
      <div className="flex items-start gap-4">
        <Link
          href="/transactions"
          className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center hover:bg-slate-700 transition-all flex-shrink-0 mt-0.5"
        >
          <ArrowLeft className="w-4 h-4 text-slate-400" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-slate-100 font-mono">{txn.id}</h1>
            <StateBadge state={txn.state} />
            {isPolicyRejected && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                ⚠ AI Overridden by Policy
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {formatDateTime(txn.createdAt)} · Order: {txn.merchantOrderId}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className={clsx(
            'text-2xl font-black',
            txn.state === 'RECOVERED' ? 'gradient-text-success' : 'text-slate-200'
          )}>
            {formatINR(txn.amountPaise)}
          </div>
          {txn.state === 'RECOVERED' && (
            <div className="text-xs text-emerald-500 mt-1">✓ Revenue Recovered</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left: Transaction Info */}
        <div className="lg:col-span-1 space-y-4">

          {/* Customer card */}
          <div className="glass-card p-4 border border-slate-800">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Customer</h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-sm font-bold text-white">
                {customer.name.charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-slate-200">{customer.name}</div>
                <div className="text-xs text-slate-500">{customer.email}</div>
              </div>
            </div>
            <div className="text-xs text-slate-500">{customer.phone}</div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-900/60 rounded-lg p-2">
                <div className="text-sm font-bold text-slate-200">{customer.totalTransactions}</div>
                <div className="text-[10px] text-slate-600">Total</div>
              </div>
              <div className="bg-slate-900/60 rounded-lg p-2">
                <div className="text-sm font-bold text-emerald-400">{customer.successfulTransactions}</div>
                <div className="text-[10px] text-slate-600">Success</div>
              </div>
              <div className="bg-slate-900/60 rounded-lg p-2">
                <div className="text-sm font-bold text-red-400">{customer.failedTransactions}</div>
                <div className="text-[10px] text-slate-600">Failed</div>
              </div>
            </div>
          </div>

          {/* Transaction details */}
          <div className="glass-card p-4 border border-slate-800 space-y-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Payment Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Amount</span>
                <span className="font-bold text-slate-200">{formatINR(txn.amountPaise)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Method</span>
                <PaymentMethodBadge method={txn.paymentMethod} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Failure</span>
                <FailureBadge reason={txn.failureReason} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Error Code</span>
                <span className="font-mono text-xs text-slate-400">{txn.failureCode}</span>
              </div>
              {txn.recoveredAt && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Recovered At</span>
                  <span className="text-xs text-emerald-400">{formatDateTime(txn.recoveredAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Recovery attempts */}
          {recoveryAttempts.length > 0 && (
            <div className="glass-card p-4 border border-slate-800">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Recovery Attempts ({recoveryAttempts.length})
              </h3>
              <div className="space-y-2">
                {recoveryAttempts.map((attempt) => (
                  <div key={attempt.id} className="flex items-center gap-3 text-xs">
                    <div className={clsx(
                      'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0',
                      attempt.result === 'SUCCESS'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/20 text-red-400'
                    )}>
                      {attempt.result === 'SUCCESS' ? '✓' : '✗'}
                    </div>
                    <div className="flex-1">
                      <div className="text-slate-300">
                        #{attempt.attemptNumber} — <ActionBadge action={attempt.action} />
                      </div>
                      {attempt.reason && (
                        <div className="text-slate-600 mt-0.5">{attempt.reason}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: AI + Policy + Audit */}
        <div className="lg:col-span-2 space-y-4">

          {/* AI Diagnosis Panel */}
          {aiDiagnosis && (
            <div className="glass-card border border-blue-500/20 overflow-hidden">
              <div className="px-5 py-4 bg-blue-500/5 border-b border-blue-500/15 flex items-center gap-2">
                <Brain className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-blue-300">AI Diagnosis</h3>
                <span className="ml-auto text-xs text-slate-600">Structured JSON output · Validated before use</span>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-900/60 rounded-lg p-3">
                    <div className="text-xs text-slate-500 mb-1">Recoverability</div>
                    <RecoverabilityBadge level={aiDiagnosis.recoverability} />
                  </div>
                  <div className="bg-slate-900/60 rounded-lg p-3">
                    <div className="text-xs text-slate-500 mb-1">Confidence</div>
                    <div className="text-lg font-bold text-slate-200">{aiDiagnosis.confidencePercent}%</div>
                  </div>
                  <div className="bg-slate-900/60 rounded-lg p-3">
                    <div className="text-xs text-slate-500 mb-1">Recommended</div>
                    <ActionBadge action={aiDiagnosis.recommendedStrategy} />
                  </div>
                </div>

                <div className="bg-slate-900/40 rounded-lg p-3">
                  <div className="text-xs text-slate-500 mb-1">AI Reasoning</div>
                  <p className="text-sm text-slate-300">{aiDiagnosis.reason}</p>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Max retries (AI): <span className="text-slate-300 font-medium">{aiDiagnosis.recommendedMaxRetries}</span>
                  </span>
                  <span className="text-slate-500">
                    Fallback: <ActionBadge action={aiDiagnosis.fallbackStrategy} />
                  </span>
                </div>

                {/* "Why this strategy?" expandable */}
                <div className="border border-slate-800 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setWhyExpanded(!whyExpanded)}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-900/60 hover:bg-slate-800/60 transition-all text-xs font-semibold text-slate-400"
                  >
                    <span>WHY DID AI CHOOSE THIS STRATEGY?</span>
                    {whyExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                  {whyExpanded && (
                    <div className="px-4 py-3 space-y-2.5 bg-slate-950/40">
                      {[
                        { label: 'Failure Classification', text: aiDiagnosis.explanation.failureClassification },
                        { label: 'Customer History', text: aiDiagnosis.explanation.customerHistory },
                        { label: 'Transaction Context', text: aiDiagnosis.explanation.transactionContext },
                        { label: 'Conclusion', text: aiDiagnosis.explanation.conclusion },
                      ].map(item => (
                        <div key={item.label}>
                          <div className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide mb-0.5">
                            {item.label}
                          </div>
                          <p className="text-xs text-slate-400">{item.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Policy Validation Panel */}
          {policyValidation && (
            <div className={clsx(
              'glass-card border overflow-hidden',
              isPolicyRejected ? 'border-red-500/30' : isPolicyModified ? 'border-amber-500/30' : 'border-emerald-500/20'
            )}>
              <div className={clsx(
                'px-5 py-4 border-b flex items-center gap-2',
                isPolicyRejected ? 'bg-red-500/5 border-red-500/20' :
                isPolicyModified ? 'bg-amber-500/5 border-amber-500/20' :
                'bg-emerald-500/5 border-emerald-500/15'
              )}>
                <Shield className={clsx(
                  'w-4 h-4',
                  isPolicyRejected ? 'text-red-400' : isPolicyModified ? 'text-amber-400' : 'text-emerald-400'
                )} />
                <h3 className={clsx(
                  'text-sm font-semibold',
                  isPolicyRejected ? 'text-red-300' : isPolicyModified ? 'text-amber-300' : 'text-emerald-300'
                )}>
                  Deterministic Policy Engine
                </h3>
                <span className="ml-auto text-xs text-slate-600">Financial rules · Not overridable by AI</span>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Policy Decision</div>
                    <PolicyBadge decision={policyValidation.decision} />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Approved Action</div>
                    <ActionBadge action={policyValidation.approvedAction} />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Max Retries (Applied)</div>
                    <span className="text-sm font-bold text-slate-200">{policyValidation.appliedMaxRetries}</span>
                  </div>
                </div>

                {isPolicyRejected && policyValidation.rejectionReason && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-semibold text-red-400 mb-1">AI Recommendation Rejected</div>
                        <p className="text-xs text-slate-400">{policyValidation.rejectionReason}</p>
                      </div>
                    </div>
                  </div>
                )}

                {isPolicyModified && policyValidation.modificationReason && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-semibold text-amber-400 mb-1">AI Recommendation Modified</div>
                        <p className="text-xs text-slate-400">{policyValidation.modificationReason}</p>
                      </div>
                    </div>
                  </div>
                )}

                {!isPolicyRejected && !isPolicyModified && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <p className="text-xs text-slate-400">AI recommendation approved — within all policy bounds.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Audit Trail */}
          <div className="glass-card border border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <h3 className="text-sm font-semibold text-slate-200">Audit Trail</h3>
              <span className="ml-auto text-xs text-slate-600">{auditLog.length} events</span>
            </div>
            <div className="p-4">
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-3.5 top-3 bottom-3 w-px bg-slate-800" />

                <div className="space-y-4">
                  {auditLog.map((entry, index) => (
                    <div key={entry.id} className="flex gap-4 relative">
                      {/* Dot */}
                      <div className={clsx(
                        'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2',
                        entry.state === 'RECOVERED'
                          ? 'bg-emerald-500/20 border-emerald-500/40'
                          : entry.state === 'FAILED' || entry.state === 'FAILED_AGAIN'
                          ? 'bg-red-500/20 border-red-500/40'
                          : entry.state === 'STOPPED'
                          ? 'bg-slate-500/20 border-slate-500/40'
                          : 'bg-blue-500/20 border-blue-500/40'
                      )}>
                        <span className="text-xs">
                          {entry.state === 'RECOVERED' ? '✓' :
                           entry.state === 'FAILED' || entry.state === 'FAILED_AGAIN' ? '✗' :
                           entry.state === 'STOPPED' ? '■' : '●'}
                        </span>
                      </div>

                      <div className="flex-1 pb-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-sm font-medium text-slate-200">{entry.event}</div>
                          <div className="text-[10px] text-slate-600 flex-shrink-0">
                            {new Date(entry.timestamp).toLocaleTimeString('en-IN', {
                              hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
                            })}
                          </div>
                        </div>

                        <div className="mt-1 space-y-1">
                          {entry.aiDecision && (
                            <div className="text-xs bg-blue-500/10 border border-blue-500/20 rounded px-2 py-1">
                              <span className="text-blue-400 font-semibold">AI: </span>
                              <span className="text-slate-400">{entry.aiDecision}</span>
                            </div>
                          )}
                          {entry.policyDecision && (
                            <div className={clsx(
                              'text-xs rounded px-2 py-1 border',
                              entry.policyDecision.includes('REJECTED')
                                ? 'bg-red-500/10 border-red-500/20'
                                : 'bg-emerald-500/10 border-emerald-500/20'
                            )}>
                              <span className={clsx(
                                'font-semibold',
                                entry.policyDecision.includes('REJECTED') ? 'text-red-400' : 'text-emerald-400'
                              )}>Policy: </span>
                              <span className="text-slate-400">{entry.policyDecision}</span>
                            </div>
                          )}
                          {entry.action && !entry.aiDecision && !entry.policyDecision && (
                            <div className="text-xs text-slate-500">Action: {entry.action}</div>
                          )}
                          {entry.result && (
                            <div className="text-xs text-slate-500">Result: {entry.result}</div>
                          )}
                          {entry.reason && (
                            <div className="text-xs text-slate-600 italic">{entry.reason}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
