'use client';

import { clsx } from 'clsx';
import { TransactionState, FailureReason, RecoveryAction, PolicyDecision } from '@/lib/types';
import { STATE_LABELS, FAILURE_REASON_LABELS, RECOVERY_ACTION_LABELS } from '@/lib/utils';

// ---- Transaction State Badge ----
export function StateBadge({ state }: { state: TransactionState }) {
  const colorMap: Record<TransactionState, string> = {
    FAILED: 'bg-red-500/15 text-red-400 border-red-500/30',
    DIAGNOSING: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    RECOVERABLE: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    NON_RECOVERABLE: 'bg-red-600/15 text-red-500 border-red-600/30',
    STRATEGY_SELECTED: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    ACTION_EXECUTED: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    WAITING_FOR_RESULT: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    RECOVERED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    FAILED_AGAIN: 'bg-red-500/15 text-red-400 border-red-500/30',
    STOPPED: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  };

  const dotMap: Record<TransactionState, string> = {
    FAILED: 'bg-red-400',
    DIAGNOSING: 'bg-yellow-400 pulse-slow',
    RECOVERABLE: 'bg-blue-400',
    NON_RECOVERABLE: 'bg-red-500',
    STRATEGY_SELECTED: 'bg-violet-400',
    ACTION_EXECUTED: 'bg-indigo-400 pulse-slow',
    WAITING_FOR_RESULT: 'bg-orange-400 pulse-slow',
    RECOVERED: 'bg-emerald-400',
    FAILED_AGAIN: 'bg-red-400',
    STOPPED: 'bg-slate-400',
  };

  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
      colorMap[state]
    )}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', dotMap[state])} />
      {STATE_LABELS[state]}
    </span>
  );
}

// ---- Failure Reason Badge ----
export function FailureBadge({ reason }: { reason: FailureReason }) {
  const colorMap: Record<FailureReason, string> = {
    INSUFFICIENT_FUNDS: 'bg-red-500/10 text-red-400 border-red-500/20',
    CARD_DECLINED: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    NETWORK_FAILURE: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    AUTH_FAILURE: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    EXPIRED_CARD: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    TIMEOUT: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    CUSTOMER_ABANDONED: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    UNKNOWN: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };

  return (
    <span className={clsx(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
      colorMap[reason]
    )}>
      {FAILURE_REASON_LABELS[reason]}
    </span>
  );
}

// ---- Recovery Action Badge ----
export function ActionBadge({ action }: { action: RecoveryAction }) {
  const colorMap: Record<RecoveryAction, string> = {
    RETRY: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    SEND_PAYMENT_LINK: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    SEND_WHATSAPP: 'bg-green-500/10 text-green-400 border-green-500/20',
    VOICE_CONTACT: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    WAIT: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    STOP: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };

  return (
    <span className={clsx(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
      colorMap[action]
    )}>
      {RECOVERY_ACTION_LABELS[action]}
    </span>
  );
}

// ---- Policy Decision Badge ----
export function PolicyBadge({ decision }: { decision: PolicyDecision }) {
  const colorMap: Record<PolicyDecision, string> = {
    APPROVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    REJECTED: 'bg-red-500/10 text-red-400 border-red-500/20',
    MODIFIED: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };

  const labelMap: Record<PolicyDecision, string> = {
    APPROVED: '✓ Policy Approved',
    REJECTED: '✗ Policy Rejected',
    MODIFIED: '⚡ Policy Modified',
  };

  return (
    <span className={clsx(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
      colorMap[decision]
    )}>
      {labelMap[decision]}
    </span>
  );
}

// ---- Recoverability Badge ----
export function RecoverabilityBadge({ level }: { level: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE' }) {
  const colorMap = {
    HIGH: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    MEDIUM: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    LOW: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    NONE: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  return (
    <span className={clsx(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
      colorMap[level]
    )}>
      {level} Recoverability
    </span>
  );
}

// ---- Payment Method Badge ----
export function PaymentMethodBadge({ method }: { method: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
      {method}
    </span>
  );
}
