// RecoverAI — Utility helpers

import { FailureReason, PaymentMethod, RecoveryAction, TransactionState } from './types';

/** Format paise to INR string */
export function formatINR(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(rupees);
}

/** Format paise to short INR (e.g. ₹1.4L) */
export function formatINRShort(paise: number): string {
  const rupees = paise / 100;
  if (rupees >= 10_00_000) return `₹${(rupees / 10_00_000).toFixed(1)}Cr`;
  if (rupees >= 1_00_000) return `₹${(rupees / 1_00_000).toFixed(1)}L`;
  if (rupees >= 1_000) return `₹${(rupees / 1_000).toFixed(1)}K`;
  return `₹${rupees.toFixed(0)}`;
}

/** Generate a short transaction ID */
export function generateTxnId(): string {
  return `TXN${Date.now().toString(36).toUpperCase()}${Math.random()
    .toString(36)
    .substring(2, 6)
    .toUpperCase()}`;
}

/** Generate a UUID-like string */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 10) +
    Math.random().toString(36).substring(2, 10);
}

/** Human-readable failure reason labels */
export const FAILURE_REASON_LABELS: Record<FailureReason, string> = {
  INSUFFICIENT_FUNDS: 'Insufficient Funds',
  CARD_DECLINED: 'Card Declined',
  NETWORK_FAILURE: 'Network Failure',
  AUTH_FAILURE: 'Authentication Failure',
  EXPIRED_CARD: 'Expired Card',
  TIMEOUT: 'Timeout',
  CUSTOMER_ABANDONED: 'Customer Abandoned',
  UNKNOWN: 'Unknown / Temporary',
};

/** Human-readable payment method labels */
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  UPI: 'UPI',
  CARD: 'Credit/Debit Card',
  NET_BANKING: 'Net Banking',
  WALLET: 'Wallet',
  EMI: 'EMI',
};

/** Human-readable recovery action labels */
export const RECOVERY_ACTION_LABELS: Record<RecoveryAction, string> = {
  RETRY: 'Auto Retry',
  SEND_PAYMENT_LINK: 'Send Payment Link',
  SEND_WHATSAPP: 'Send WhatsApp',
  VOICE_CONTACT: 'Voice Call',
  WAIT: 'Wait & Monitor',
  STOP: 'Stop Recovery',
};

/** Human-readable transaction state labels */
export const STATE_LABELS: Record<TransactionState, string> = {
  FAILED: 'Failed',
  DIAGNOSING: 'Diagnosing',
  RECOVERABLE: 'Recoverable',
  NON_RECOVERABLE: 'Non-Recoverable',
  STRATEGY_SELECTED: 'Strategy Selected',
  ACTION_EXECUTED: 'Action Executed',
  WAITING_FOR_RESULT: 'Waiting',
  RECOVERED: 'Recovered',
  FAILED_AGAIN: 'Failed Again',
  STOPPED: 'Stopped',
};

/** Color classes for transaction states */
export const STATE_COLORS: Record<TransactionState, string> = {
  FAILED: 'text-red-400 bg-red-400/10 border-red-400/20',
  DIAGNOSING: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  RECOVERABLE: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  NON_RECOVERABLE: 'text-red-500 bg-red-500/10 border-red-500/20',
  STRATEGY_SELECTED: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  ACTION_EXECUTED: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
  WAITING_FOR_RESULT: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  RECOVERED: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  FAILED_AGAIN: 'text-red-400 bg-red-400/10 border-red-400/20',
  STOPPED: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
};

/** Color classes for failure reasons */
export const FAILURE_COLORS: Record<FailureReason, string> = {
  INSUFFICIENT_FUNDS: '#f87171',
  CARD_DECLINED: '#fb923c',
  NETWORK_FAILURE: '#facc15',
  AUTH_FAILURE: '#a78bfa',
  EXPIRED_CARD: '#f472b6',
  TIMEOUT: '#60a5fa',
  CUSTOMER_ABANDONED: '#4ade80',
  UNKNOWN: '#94a3b8',
};

/** Format relative time */
export function formatRelativeTime(isoString: string): string {
  const now = new Date();
  const date = new Date(isoString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

/** Format datetime for display */
export function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
