'use client';

import { useState, useCallback } from 'react';
import { FlaskConical, Play, CheckCircle2, AlertTriangle, Brain, Shield, Zap, Info } from 'lucide-react';
import { useAppState } from '@/lib/store';
import {
  Customer, FailureReason, PaymentMethod, Transaction,
  TransactionState, AuditLogEntry, RecoveryAttempt
} from '@/lib/types';
import { SYNTHETIC_CUSTOMERS } from '@/lib/synthetic-data';
import { simulateAIDiagnosis, validateAIDiagnosisSchema, getSafeFallbackDiagnosis } from '@/lib/ai-diagnosis';
import { validateAIRecommendation } from '@/lib/recovery-engine';
import { generateId, formatINR, FAILURE_REASON_LABELS, RECOVERY_ACTION_LABELS, formatDateTime } from '@/lib/utils';
import { api } from '@/lib/api';
import { StateBadge, FailureBadge, RecoverabilityBadge, ActionBadge, PolicyBadge } from '@/components/ui/Badges';
import { clsx } from 'clsx';

type PipelineStep = {
  id: string;
  label: string;
  state: 'pending' | 'running' | 'done' | 'error';
  detail?: string;
  variant?: 'ai' | 'policy' | 'action' | 'result';
};

const FAILURE_CODES: Record<FailureReason, string> = {
  NETWORK_FAILURE: 'NETWORK_ERROR',
  TIMEOUT: 'GATEWAY_TIMEOUT',
  UNKNOWN: 'UNKNOWN_ERROR',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  CARD_DECLINED: 'CARD_DECLINED',
  AUTH_FAILURE: 'OTP_EXPIRED',
  EXPIRED_CARD: 'EXPIRED_CARD',
  CUSTOMER_ABANDONED: 'PAYMENT_CANCELLED',
};

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export default function SimulationPage() {
  const { addTransaction } = useAppState();

  const [selectedCustomer, setSelectedCustomer] = useState<Customer>(SYNTHETIC_CUSTOMERS[0]);
  const [amountStr, setAmountStr] = useState('4999');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [failureReason, setFailureReason] = useState<FailureReason>('NETWORK_FAILURE');

  const [isRunning, setIsRunning] = useState(false);
  const [pipeline, setPipeline] = useState<PipelineStep[]>([]);
  const [resultTxn, setResultTxn] = useState<Transaction | null>(null);
  const [done, setDone] = useState(false);

  function updateStep(id: string, update: Partial<PipelineStep>) {
    setPipeline(prev => prev.map(s => s.id === id ? { ...s, ...update } : s));
  }

  const runSimulation = useCallback(async () => {
    if (isRunning) return;

    const amountPaise = Math.round(parseFloat(amountStr || '0') * 100);
    if (amountPaise <= 0 || isNaN(amountPaise)) return;

    setIsRunning(true);
    setDone(false);
    setResultTxn(null);

    const steps: PipelineStep[] = [
      { id: 'fail', label: 'Payment Failure Received', state: 'pending' },
      { id: 'diagnose', label: 'AI Diagnosing Failure', state: 'pending', variant: 'ai' },
      { id: 'validate', label: 'Policy Engine Validation', state: 'pending', variant: 'policy' },
      { id: 'execute', label: 'Executing Recovery Action', state: 'pending', variant: 'action' },
      { id: 'result', label: 'Recovery Result', state: 'pending', variant: 'result' },
    ];
    setPipeline(steps);

    try {
      // Step 1 — Payment failure
      updateStep('fail', { state: 'running' });
      await sleep(600);
      updateStep('fail', { state: 'done', detail: `₹${amountPaise / 100} failed · ${FAILURE_REASON_LABELS[failureReason]}` });
      await sleep(400);

      // Call Backend API to run the simulation and get the final deterministic state
      const txn = await api.simulateFailure({
        amountPaise,
        paymentMethod,
        failureReason,
        customerId: selectedCustomer.id
      });
      
      const diagnosis = txn.aiDiagnosis;
      const policyResult = txn.policyValidation;

      // Step 2 — AI Diagnosis (simulate latency visually)
      updateStep('diagnose', { state: 'running' });
      await sleep(1200); 

      if (diagnosis) {
        updateStep('diagnose', {
          state: 'done',
          detail: `${diagnosis.recoverability} recoverability · ${diagnosis.confidencePercent}% confidence · Recommends: ${RECOVERY_ACTION_LABELS[diagnosis.recommendedStrategy as keyof typeof RECOVERY_ACTION_LABELS]}`,
        });
      } else {
        updateStep('diagnose', { state: 'done', detail: `Deterministic diagnosis complete` });
      }
      await sleep(400);

      // Step 3 — Policy validation
      updateStep('validate', { state: 'running' });
      await sleep(500);

      let policyDetail = 'Policy evaluated';
      if (policyResult) {
        policyDetail = policyResult.decision === 'REJECTED'
          ? `❌ REJECTED — ${policyResult.rejectionReason}`
          : policyResult.decision === 'MODIFIED'
          ? `⚡ MODIFIED — ${policyResult.modificationReason}`
          : `✓ APPROVED — ${RECOVERY_ACTION_LABELS[policyResult.approvedAction as keyof typeof RECOVERY_ACTION_LABELS]}`;
      }
      
      updateStep('validate', { state: 'done', detail: policyDetail });
      await sleep(500);

      // Step 4 — Execute recovery
      if (policyResult?.approvedAction === 'STOP' || txn.state === 'STOPPED' || txn.state === 'NON_RECOVERABLE') {
        updateStep('execute', { state: 'done', detail: 'Recovery stopped — no action taken.' });
        updateStep('result', { state: 'done', detail: 'Stopped — no recovery action.' });
        
        setResultTxn(txn);
        setDone(true);
        setIsRunning(false);
        return;
      }

      updateStep('execute', { state: 'running' });
      await sleep(1000);

      updateStep('execute', {
        state: 'done',
        detail: `Recovery strategy executed with customer`,
      });
      await sleep(800);

      // Step 5 — Result
      updateStep('result', { state: 'running' });
      
      // If the backend has not fully recovered it, we might need to call recover endpoint,
      // but in this demo backend `simulate_failure` leaves it in RECOVERABLE. We need to call `/recover`
      const finalTxn = await api.recoverTransaction(txn.id);
      
      await sleep(700);

      if (finalTxn.state === 'RECOVERED') {
        updateStep('result', { state: 'done', detail: `✓ RECOVERED — ${formatINR(finalTxn.recoveredAmountPaise || finalTxn.amountPaise)}` });
      } else if (finalTxn.state === 'STOPPED') {
        updateStep('result', { state: 'error', detail: '✗ Recovery failed — payment unrecovered' });
      } else {
        updateStep('result', { state: 'done', detail: `Action pending — ${finalTxn.state}` });
      }

      setResultTxn(finalTxn);
      setDone(true);
      
    } catch (err) {
      console.error(err);
      updateStep('fail', { state: 'error', detail: 'Failed to communicate with backend API' });
    } finally {
      setIsRunning(false);
    }
  }, [isRunning, amountStr, selectedCustomer, paymentMethod, failureReason]);

  return (
    <div className="p-6 space-y-5 max-w-[1000px] mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Payment Failure Simulator</h1>
          <p className="text-sm text-slate-500 mt-1">
            Simulate a payment failure and watch it flow through the AI recovery pipeline
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
          <Info className="w-3.5 h-3.5" />
          DEMO MODE
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Left: Simulation form */}
        <div className="space-y-4">
          <div className="glass-card p-5 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <FlaskConical className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-semibold text-slate-200">Configure Failure</h3>
            </div>

            {/* Customer */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Customer</label>
              <select
                value={selectedCustomer.id}
                onChange={e => setSelectedCustomer(SYNTHETIC_CUSTOMERS.find(c => c.id === e.target.value) ?? SYNTHETIC_CUSTOMERS[0])}
                disabled={isRunning}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-50"
              >
                {SYNTHETIC_CUSTOMERS.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} · {c.successfulTransactions}/{c.totalTransactions} success
                  </option>
                ))}
              </select>
              <div className="text-xs text-slate-600">
                {selectedCustomer.email} · {selectedCustomer.phone}
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount (₹)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  value={amountStr}
                  onChange={e => setAmountStr(e.target.value)}
                  disabled={isRunning}
                  placeholder="4999"
                  min="1"
                  className="w-full pl-7 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Payment method */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Payment Method</label>
              <div className="grid grid-cols-5 gap-1.5">
                {(['UPI', 'CARD', 'NET_BANKING', 'WALLET', 'EMI'] as PaymentMethod[]).map(m => (
                  <button
                    key={m}
                    onClick={() => setPaymentMethod(m)}
                    disabled={isRunning}
                    className={clsx(
                      'px-2 py-2 rounded-lg text-xs font-medium border transition-all',
                      paymentMethod === m
                        ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                        : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-600'
                    )}
                  >
                    {m.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Failure reason */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Failure Reason</label>
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.entries(FAILURE_REASON_LABELS) as [FailureReason, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setFailureReason(key)}
                    disabled={isRunning}
                    className={clsx(
                      'px-3 py-2 rounded-lg text-xs text-left border transition-all',
                      failureReason === key
                        ? 'bg-red-500/15 border-red-500/40 text-red-300'
                        : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-600'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulate button */}
            <button
              onClick={runSimulation}
              disabled={isRunning}
              className={clsx(
                'w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-bold transition-all',
                isRunning
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'btn-primary text-white shadow-lg'
              )}
            >
              {isRunning ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-500 border-t-slate-300 rounded-full animate-spin" />
                  Running simulation...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  SIMULATE FAILURE
                </>
              )}
            </button>
          </div>

          {/* Summary card */}
          {!isRunning && !done && (
            <div className="glass-card p-4 border border-slate-800">
              <div className="text-xs text-slate-600 text-center space-y-1">
                <div className="text-slate-400 font-medium">Ready to simulate</div>
                <div>Customer: <span className="text-slate-300">{selectedCustomer.name}</span></div>
                <div>Amount: <span className="text-slate-300">₹{parseFloat(amountStr || '0').toLocaleString('en-IN')}</span></div>
                <div>Method: <span className="text-slate-300">{paymentMethod}</span></div>
                <div>Failure: <span className="text-slate-300">{FAILURE_REASON_LABELS[failureReason]}</span></div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Recovery pipeline */}
        <div className="space-y-4">
          {pipeline.length > 0 && (
            <div className="glass-card p-5 border border-slate-800">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800 mb-4">
                <Zap className="w-4 h-4 text-yellow-400" />
                <h3 className="text-sm font-semibold text-slate-200">Recovery Pipeline</h3>
              </div>

              <div className="space-y-3">
                {pipeline.map((step, index) => (
                  <div key={step.id} className="flex gap-3">
                    {/* Icon */}
                    <div className={clsx(
                      'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all',
                      step.state === 'running' ? 'bg-blue-500/20 border border-blue-500/40' :
                      step.state === 'done' ? 'bg-emerald-500/20 border border-emerald-500/40' :
                      step.state === 'error' ? 'bg-red-500/20 border border-red-500/40' :
                      'bg-slate-800 border border-slate-700'
                    )}>
                      {step.state === 'running' ? (
                        <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                      ) : step.state === 'done' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : step.state === 'error' ? (
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                      ) : (
                        <span className="text-xs text-slate-600 font-bold">{index + 1}</span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pt-1">
                      <div className="flex items-center gap-2">
                        <span className={clsx(
                          'text-sm font-medium',
                          step.state === 'running' ? 'text-blue-300' :
                          step.state === 'done' ? 'text-slate-200' :
                          step.state === 'error' ? 'text-red-300' :
                          'text-slate-600'
                        )}>
                          {step.label}
                        </span>
                        {step.variant === 'ai' && (
                          <span className="flex items-center gap-1 text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-full border border-blue-500/20">
                            <Brain className="w-2.5 h-2.5" /> AI
                          </span>
                        )}
                        {step.variant === 'policy' && (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                            <Shield className="w-2.5 h-2.5" /> Policy
                          </span>
                        )}
                      </div>
                      {step.detail && (
                        <p className="text-xs text-slate-500 mt-0.5">{step.detail}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Result card */}
          {resultTxn && done && (
            <div className={clsx(
              'glass-card p-5 border transition-all',
              resultTxn.state === 'RECOVERED'
                ? 'border-emerald-500/30 glow-green'
                : 'border-red-500/20'
            )}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {resultTxn.state === 'RECOVERED' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  )}
                  <h3 className="text-sm font-semibold text-slate-200">
                    {resultTxn.state === 'RECOVERED' ? '✓ Payment Recovered!' : '✗ Recovery Failed'}
                  </h3>
                </div>
                <StateBadge state={resultTxn.state} />
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Transaction ID</span>
                  <span className="font-mono text-xs text-slate-400">{resultTxn.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount</span>
                  <span className={clsx('font-bold', resultTxn.state === 'RECOVERED' ? 'text-emerald-400' : 'text-slate-300')}>
                    {formatINR(resultTxn.amountPaise)}
                  </span>
                </div>
                {resultTxn.aiDiagnosis && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">AI Recoverability</span>
                    <RecoverabilityBadge level={resultTxn.aiDiagnosis.recoverability} />
                  </div>
                )}
                {resultTxn.aiDiagnosis && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">AI Recommended</span>
                    <ActionBadge action={resultTxn.aiDiagnosis.recommendedStrategy} />
                  </div>
                )}
                {resultTxn.policyValidation && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Policy Decision</span>
                    <PolicyBadge decision={resultTxn.policyValidation.decision} />
                  </div>
                )}
                {resultTxn.policyValidation && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Action Taken</span>
                    <ActionBadge action={resultTxn.policyValidation.approvedAction} />
                  </div>
                )}
              </div>

              {resultTxn.policyValidation?.decision === 'REJECTED' && (
                <div className="mt-3 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  <div className="text-xs font-semibold text-amber-400 mb-1">⚠ AI Override by Policy</div>
                  <p className="text-xs text-slate-400">{resultTxn.policyValidation.rejectionReason}</p>
                </div>
              )}

              <a
                href={`/transactions/${resultTxn.id}`}
                className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 border border-slate-700 transition-all"
              >
                View Full Transaction Detail →
              </a>

              <button
                onClick={() => { setPipeline([]); setResultTxn(null); setDone(false); }}
                className="mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs text-slate-500 hover:text-slate-400 transition-all"
              >
                Run another simulation
              </button>
            </div>
          )}

          {/* Architecture note */}
          {pipeline.length === 0 && (
            <div className="glass-card p-4 border border-slate-800">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Recovery Pipeline Flow</h4>
              <div className="space-y-2">
                {[
                  { icon: '💳', label: 'Payment Fails', color: 'text-red-400' },
                  { icon: '🤖', label: 'AI Diagnoses Cause', color: 'text-blue-400', tag: 'AI Layer' },
                  { icon: '🛡️', label: 'Policy Engine Validates', color: 'text-emerald-400', tag: 'Deterministic' },
                  { icon: '⚡', label: 'Recovery Action Executes', color: 'text-violet-400' },
                  { icon: '✓', label: 'Result Tracked & Audited', color: 'text-emerald-400' },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs">
                    <span>{s.icon}</span>
                    <span className={s.color}>{s.label}</span>
                    {s.tag && (
                      <span className="text-[10px] text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                        {s.tag}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
