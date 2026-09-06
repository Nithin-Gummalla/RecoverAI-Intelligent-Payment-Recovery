// RecoverAI — Synthetic Transaction Data
// ⚠️ DEMO DATA — This is simulated data for demonstration purposes only.
// It does NOT represent real Razorpay production statistics or actual transactions.

import {
  Customer,
  FailureReason,
  PaymentMethod,
  RecoveryAction,
  RecoveryAttempt,
  RecoveryPolicy,
  Transaction,
  TransactionState,
  AIDiagnosis,
  PolicyValidation,
  AuditLogEntry,
} from './types';
import { generateId } from './utils';

// Fixed timestamp for stable demo data (prevents hydration mismatch)
const NOW = new Date('2026-09-03T12:00:00Z').getTime();

// ---- Synthetic Customers ----
export const SYNTHETIC_CUSTOMERS: Customer[] = [
  { id: 'cust_001', name: 'Rahul Sharma', email: 'rahul.sharma@gmail.com', phone: '+91 98765 43210', totalTransactions: 12, successfulTransactions: 10, failedTransactions: 2, totalSpent: 4580000 },
  { id: 'cust_002', name: 'Priya Patel', email: 'priya.patel@outlook.com', phone: '+91 87654 32109', totalTransactions: 5, successfulTransactions: 4, failedTransactions: 1, totalSpent: 1250000 },
  { id: 'cust_003', name: 'Amit Kumar', email: 'amit.k@yahoo.com', phone: '+91 76543 21098', totalTransactions: 3, successfulTransactions: 1, failedTransactions: 2, totalSpent: 320000 },
  { id: 'cust_004', name: 'Sneha Reddy', email: 'sneha.r@proton.me', phone: '+91 65432 10987', totalTransactions: 8, successfulTransactions: 8, failedTransactions: 0, totalSpent: 6720000 },
  { id: 'cust_005', name: 'Vikram Singh', email: 'vikram.singh@gmail.com', phone: '+91 54321 09876', totalTransactions: 2, successfulTransactions: 1, failedTransactions: 1, totalSpent: 199900 },
  { id: 'cust_006', name: 'Ananya Iyer', email: 'ananya.iyer@gmail.com', phone: '+91 43210 98765', totalTransactions: 15, successfulTransactions: 14, failedTransactions: 1, totalSpent: 8900000 },
  { id: 'cust_007', name: 'Rohan Mehta', email: 'rohan.m@hotmail.com', phone: '+91 32109 87654', totalTransactions: 1, successfulTransactions: 0, failedTransactions: 1, totalSpent: 0 },
  { id: 'cust_008', name: 'Divya Nair', email: 'divya.nair@gmail.com', phone: '+91 21098 76543', totalTransactions: 7, successfulTransactions: 6, failedTransactions: 1, totalSpent: 3100000 },
  { id: 'cust_009', name: 'Sanjay Gupta', email: 's.gupta@corp.in', phone: '+91 10987 65432', totalTransactions: 4, successfulTransactions: 2, failedTransactions: 2, totalSpent: 890000 },
  { id: 'cust_010', name: 'Kavitha Pillai', email: 'kavitha.p@gmail.com', phone: '+91 99887 76655', totalTransactions: 9, successfulTransactions: 9, failedTransactions: 0, totalSpent: 4120000 },
];

// ---- Default Recovery Policy ----
export const DEFAULT_RECOVERY_POLICY: RecoveryPolicy = {
  id: 'policy_default',
  merchantId: 'merchant_demo',
  maxRetries: 2,
  minAmountForAutoRetryPaise: 10000,     // ₹100
  maxAmountForAutoRecoveryPaise: 5000000, // ₹50,000
  allowedChannels: ['RETRY', 'SEND_PAYMENT_LINK', 'SEND_WHATSAPP'],
  stopAfterFailures: 2,
  retryDelayMinutes: 15,
  enableWhatsApp: true,
  enableVoice: false,
};

// ---- Helper to build audit log entries ----
function auditEntry(
  txnId: string,
  event: string,
  state: TransactionState,
  opts: Partial<AuditLogEntry> = {},
  minutesAgo = 0
): AuditLogEntry {
  const ts = new Date(NOW - minutesAgo * 60000).toISOString();
  return {
    id: generateId(),
    transactionId: txnId,
    timestamp: ts,
    event,
    state,
    ...opts,
  };
}

// ---- Build a RECOVERED transaction ----
function makeRecovered(
  id: string,
  customer: Customer,
  amountPaise: number,
  method: PaymentMethod,
  failureReason: FailureReason,
  failureCode: string,
  minsAgo: number
): Transaction {
  const createdAt = new Date(NOW - minsAgo * 60000).toISOString();
  const recoveredAt = new Date(NOW - (minsAgo - 22) * 60000).toISOString();

  const attempts: RecoveryAttempt[] = [
    {
      id: generateId(),
      transactionId: id,
      attemptNumber: 1,
      action: 'RETRY',
      timestamp: new Date(NOW - (minsAgo - 5) * 60000).toISOString(),
      result: 'FAILED',
      reason: 'Still failed on first retry',
    },
    {
      id: generateId(),
      transactionId: id,
      attemptNumber: 2,
      action: 'SEND_PAYMENT_LINK',
      timestamp: new Date(NOW - (minsAgo - 15) * 60000).toISOString(),
      result: 'SUCCESS',
      reason: 'Customer completed payment via link',
    },
  ];

  const aiDiagnosis: AIDiagnosis = {
    failureCategory: failureReason,
    recoverability: 'HIGH',
    confidencePercent: 89,
    reason: 'Temporary technical failure. Customer has strong payment history.',
    recommendedStrategy: 'RETRY',
    recommendedMaxRetries: 2,
    fallbackStrategy: 'SEND_PAYMENT_LINK',
    explanation: {
      failureClassification: 'Classified as transient technical error — no indication of fraud or inability to pay.',
      customerHistory: `Customer has ${customer.successfulTransactions} successful payments. High trust score.`,
      transactionContext: `Amount ₹${amountPaise / 100} is within auto-recovery threshold.`,
      conclusion: 'Recommended auto-retry followed by payment link if retry fails.',
    },
  };

  const policyValidation: PolicyValidation = {
    decision: 'APPROVED',
    approvedAction: 'RETRY',
    appliedMaxRetries: 2,
  };

  const auditLog: AuditLogEntry[] = [
    auditEntry(id, 'Payment failed', 'FAILED', { result: `₹${amountPaise / 100} payment failed — ${failureCode}` }, minsAgo),
    auditEntry(id, 'AI diagnosis started', 'DIAGNOSING', {}, minsAgo - 1),
    auditEntry(id, 'AI diagnosis complete', 'RECOVERABLE', { aiDecision: 'HIGH recoverability (89% confidence)', action: 'RETRY recommended' }, minsAgo - 2),
    auditEntry(id, 'Policy validation', 'STRATEGY_SELECTED', { policyDecision: 'APPROVED — Retry within policy limits', action: 'RETRY' }, minsAgo - 2),
    auditEntry(id, 'Retry attempt #1 initiated', 'ACTION_EXECUTED', { action: 'RETRY' }, minsAgo - 5),
    auditEntry(id, 'Retry attempt #1 failed', 'FAILED_AGAIN', { result: 'FAILED', reason: 'Still failed' }, minsAgo - 7),
    auditEntry(id, 'Sending payment link', 'ACTION_EXECUTED', { action: 'SEND_PAYMENT_LINK' }, minsAgo - 10),
    auditEntry(id, 'Payment link sent to customer', 'WAITING_FOR_RESULT', {}, minsAgo - 11),
    auditEntry(id, 'Customer completed payment', 'RECOVERED', { result: `RECOVERED — ₹${amountPaise / 100}` }, minsAgo - 22),
  ];

  return {
    id,
    customer,
    amountPaise,
    paymentMethod: method,
    failureReason,
    failureCode,
    createdAt,
    updatedAt: recoveredAt,
    state: 'RECOVERED',
    merchantOrderId: `ORD_${id}`,
    aiDiagnosis,
    policyValidation,
    recoveryAttempts: attempts,
    recoveredAmountPaise: amountPaise,
    recoveredAt,
    auditLog,
  };
}

// ---- Build a NON-RECOVERABLE transaction ----
function makeNonRecoverable(
  id: string,
  customer: Customer,
  amountPaise: number,
  method: PaymentMethod,
  failureReason: FailureReason,
  failureCode: string,
  minsAgo: number
): Transaction {
  const createdAt = new Date(NOW - minsAgo * 60000).toISOString();

  const aiDiagnosis: AIDiagnosis = {
    failureCategory: failureReason,
    recoverability: 'NONE',
    confidencePercent: 95,
    reason: 'Permanent failure — insufficient funds or card issue. Retry unlikely to succeed.',
    recommendedStrategy: 'STOP',
    recommendedMaxRetries: 0,
    fallbackStrategy: 'STOP',
    explanation: {
      failureClassification: 'Classified as permanent financial constraint.',
      customerHistory: `Customer has ${customer.failedTransactions} prior failures.`,
      transactionContext: 'No point retrying — funds issue confirmed.',
      conclusion: 'Recovery not recommended. Stop to avoid frustrating the customer.',
    },
  };

  const policyValidation: PolicyValidation = {
    decision: 'APPROVED',
    approvedAction: 'STOP',
    appliedMaxRetries: 0,
  };

  const auditLog: AuditLogEntry[] = [
    auditEntry(id, 'Payment failed', 'FAILED', { result: `${failureCode}` }, minsAgo),
    auditEntry(id, 'AI diagnosis complete', 'NON_RECOVERABLE', { aiDecision: 'NON-RECOVERABLE (95% confidence)', action: 'STOP recommended' }, minsAgo - 1),
    auditEntry(id, 'Policy validated', 'STOPPED', { policyDecision: 'APPROVED — STOP', action: 'STOP', result: 'Recovery halted' }, minsAgo - 1),
  ];

  return {
    id,
    customer,
    amountPaise,
    paymentMethod: method,
    failureReason,
    failureCode,
    createdAt,
    updatedAt: createdAt,
    state: 'STOPPED',
    merchantOrderId: `ORD_${id}`,
    aiDiagnosis,
    policyValidation,
    recoveryAttempts: [],
    auditLog,
  };
}

// ---- Build a FAILED (in-progress / diagnosing) transaction ----
function makeFailed(
  id: string,
  customer: Customer,
  amountPaise: number,
  method: PaymentMethod,
  failureReason: FailureReason,
  failureCode: string,
  minsAgo: number,
  state: TransactionState = 'FAILED'
): Transaction {
  const createdAt = new Date(NOW - minsAgo * 60000).toISOString();
  const auditLog: AuditLogEntry[] = [
    auditEntry(id, 'Payment failed', 'FAILED', { result: failureCode }, minsAgo),
  ];
  if (state === 'DIAGNOSING') {
    auditLog.push(auditEntry(id, 'AI diagnosis in progress', 'DIAGNOSING', {}, minsAgo - 1));
  }
  return {
    id,
    customer,
    amountPaise,
    paymentMethod: method,
    failureReason,
    failureCode,
    createdAt,
    updatedAt: createdAt,
    state,
    merchantOrderId: `ORD_${id}`,
    recoveryAttempts: [],
    auditLog,
  };
}

// ---- Build a POLICY-REJECTED transaction (AI overridden by policy) ----
function makePolicyRejected(
  id: string,
  customer: Customer,
  amountPaise: number,
  method: PaymentMethod,
  failureReason: FailureReason,
  failureCode: string,
  minsAgo: number
): Transaction {
  const createdAt = new Date(NOW - minsAgo * 60000).toISOString();

  const aiDiagnosis: AIDiagnosis = {
    failureCategory: failureReason,
    recoverability: 'MEDIUM',
    confidencePercent: 72,
    reason: 'Temporary issue — AI recommends 5 retries.',
    recommendedStrategy: 'RETRY',
    recommendedMaxRetries: 5, // AI exceeds policy limit!
    fallbackStrategy: 'SEND_PAYMENT_LINK',
    explanation: {
      failureClassification: 'Temporary network glitch detected.',
      customerHistory: 'Mixed payment history.',
      transactionContext: 'AI thinks aggressive retry will work.',
      conclusion: 'AI recommends 5 retries. Policy only allows 2.',
    },
  };

  const policyValidation: PolicyValidation = {
    decision: 'REJECTED',
    approvedAction: 'RETRY',
    rejectionReason: 'AI recommended 5 retries but MAX_RETRIES policy = 2. AI recommendation rejected. Applying policy maximum.',
    appliedMaxRetries: 2,
  };

  const auditLog: AuditLogEntry[] = [
    auditEntry(id, 'Payment failed', 'FAILED', { result: failureCode }, minsAgo),
    auditEntry(id, 'AI diagnosis complete', 'RECOVERABLE', { aiDecision: 'MEDIUM recoverability — Retry x5 recommended' }, minsAgo - 1),
    auditEntry(id, '⚠️ AI recommendation REJECTED by policy', 'STRATEGY_SELECTED', {
      aiDecision: 'RETRY × 5 (AI)',
      policyDecision: '❌ REJECTED — MAX_RETRIES exceeded. Policy overrides AI. Retry capped at 2.',
      action: 'RETRY × 2 (policy-enforced)',
      reason: 'Safe AI override — deterministic policy enforced',
    }, minsAgo - 1),
    auditEntry(id, 'Retry attempt #1 initiated (policy-capped)', 'ACTION_EXECUTED', { action: 'RETRY' }, minsAgo - 5),
    auditEntry(id, 'Retry #1 failed', 'FAILED_AGAIN', { result: 'FAILED' }, minsAgo - 7),
    auditEntry(id, 'Retry attempt #2 initiated (policy-capped)', 'ACTION_EXECUTED', { action: 'RETRY' }, minsAgo - 20),
    auditEntry(id, 'Retry #2 failed — max retries reached', 'STOPPED', { result: 'STOPPED', reason: 'Policy stop condition met' }, minsAgo - 22),
  ];

  return {
    id,
    customer,
    amountPaise,
    paymentMethod: method,
    failureReason,
    failureCode,
    createdAt,
    updatedAt: new Date(NOW - (minsAgo - 22) * 60000).toISOString(),
    state: 'STOPPED',
    merchantOrderId: `ORD_${id}`,
    aiDiagnosis,
    policyValidation,
    recoveryAttempts: [
      { id: generateId(), transactionId: id, attemptNumber: 1, action: 'RETRY', timestamp: new Date(NOW - (minsAgo - 5) * 60000).toISOString(), result: 'FAILED', reason: 'Network still unavailable' },
      { id: generateId(), transactionId: id, attemptNumber: 2, action: 'RETRY', timestamp: new Date(NOW - (minsAgo - 20) * 60000).toISOString(), result: 'FAILED', reason: 'Network still unavailable' },
    ],
    auditLog,
  };
}

// ---- The main synthetic dataset ----
export const SYNTHETIC_TRANSACTIONS: Transaction[] = [
  // RECOVERED
  makeRecovered('TXN_001', SYNTHETIC_CUSTOMERS[0], 499900, 'UPI', 'NETWORK_FAILURE', 'BAD_REQUEST_ERROR', 120),
  makeRecovered('TXN_002', SYNTHETIC_CUSTOMERS[5], 2999900, 'CARD', 'TIMEOUT', 'GATEWAY_ERROR', 240),
  makeRecovered('TXN_003', SYNTHETIC_CUSTOMERS[3], 899900, 'NET_BANKING', 'TIMEOUT', 'PAYMENT_TIMEOUT', 480),
  makeRecovered('TXN_004', SYNTHETIC_CUSTOMERS[7], 149900, 'UPI', 'NETWORK_FAILURE', 'UPI_TIMEOUT', 1440),
  makeRecovered('TXN_005', SYNTHETIC_CUSTOMERS[1], 399900, 'WALLET', 'UNKNOWN', 'UNKNOWN_ERROR', 2880),
  makeRecovered('TXN_006', SYNTHETIC_CUSTOMERS[9], 599900, 'CARD', 'TIMEOUT', 'GATEWAY_TIMEOUT', 4320),
  makeRecovered('TXN_007', SYNTHETIC_CUSTOMERS[0], 1299900, 'EMI', 'NETWORK_FAILURE', 'NETWORK_ERROR', 5760),

  // NON-RECOVERABLE (stopped)
  makeNonRecoverable('TXN_008', SYNTHETIC_CUSTOMERS[2], 299900, 'CARD', 'INSUFFICIENT_FUNDS', 'INSUFFICIENT_FUNDS', 90),
  makeNonRecoverable('TXN_009', SYNTHETIC_CUSTOMERS[6], 499900, 'CARD', 'CARD_DECLINED', 'CARD_DECLINED', 180),
  makeNonRecoverable('TXN_010', SYNTHETIC_CUSTOMERS[4], 79900, 'CARD', 'EXPIRED_CARD', 'EXPIRED_CARD', 360),
  makeNonRecoverable('TXN_011', SYNTHETIC_CUSTOMERS[2], 1499900, 'NET_BANKING', 'INSUFFICIENT_FUNDS', 'INSUFFICIENT_FUNDS', 720),
  makeNonRecoverable('TXN_012', SYNTHETIC_CUSTOMERS[8], 349900, 'CARD', 'AUTH_FAILURE', 'AUTHENTICATION_FAILED', 1080),

  // POLICY REJECTED (AI overridden — important demo feature)
  makePolicyRejected('TXN_013', SYNTHETIC_CUSTOMERS[4], 249900, 'UPI', 'NETWORK_FAILURE', 'UPI_FAILURE', 60),
  makePolicyRejected('TXN_014', SYNTHETIC_CUSTOMERS[8], 899900, 'CARD', 'TIMEOUT', 'GATEWAY_ERROR', 300),

  // ACTIVE FAILED / DIAGNOSING
  makeFailed('TXN_015', SYNTHETIC_CUSTOMERS[1], 599900, 'UPI', 'NETWORK_FAILURE', 'UPI_TIMEOUT', 5, 'FAILED'),
  makeFailed('TXN_016', SYNTHETIC_CUSTOMERS[3], 1799900, 'CARD', 'TIMEOUT', 'GATEWAY_TIMEOUT', 3, 'DIAGNOSING'),
  makeFailed('TXN_017', SYNTHETIC_CUSTOMERS[6], 99900, 'WALLET', 'CUSTOMER_ABANDONED', 'PAYMENT_CANCELLED', 8, 'FAILED'),
  makeFailed('TXN_018', SYNTHETIC_CUSTOMERS[9], 2499900, 'EMI', 'AUTH_FAILURE', 'OTP_EXPIRED', 12, 'FAILED'),
  makeFailed('TXN_019', SYNTHETIC_CUSTOMERS[0], 399900, 'NET_BANKING', 'NETWORK_FAILURE', 'NETWORK_ERROR', 2, 'DIAGNOSING'),
  makeFailed('TXN_020', SYNTHETIC_CUSTOMERS[5], 699900, 'CARD', 'CARD_DECLINED', 'CARD_DECLINED', 15, 'FAILED'),
];

// ---- Compute dashboard metrics from synthetic data ----
export function computeDashboardMetrics(txns: Transaction[] = SYNTHETIC_TRANSACTIONS) {

  const totalTransactions = txns.length;
  const failedPayments = txns.length; // Actually, if we're only passing simulated fail data, they all failed initially. Wait, the store holds all transactions. 
  // Let's count accurately. A transaction in this array means it was a failure we tracked.
  // Actually, wait. In synthetic data, all txns are failed initially.
  
  // Total initially failed payments is all of them
  const totalFailedPayments = txns.length; 
  const successfullyRecovered = txns.filter(t => t.state === 'RECOVERED').length;
  
  const recoverablePayments = txns.filter(t =>
    t.aiDiagnosis?.recoverability === 'HIGH' || t.aiDiagnosis?.recoverability === 'MEDIUM'
  ).length;

  // Revenue Pools
  // 1. Recovered: amount of transactions that are fully recovered
  const totalRevenueRecoveredPaise = txns
    .filter(t => t.state === 'RECOVERED')
    .reduce((s, t) => s + (t.recoveredAmountPaise ?? t.amountPaise), 0);

  // 2. Lost: amount of transactions that are definitively stopped/unrecoverable
  const totalRevenueLostPaise = txns
    .filter(t => t.state === 'STOPPED' || t.state === 'NON_RECOVERABLE')
    .reduce((s, t) => s + t.amountPaise, 0);

  // 3. At Risk: amount of transactions still actively in the recovery pipeline
  const revenueAtRiskPaise = txns
    .filter(t => t.state !== 'RECOVERED' && t.state !== 'STOPPED' && t.state !== 'NON_RECOVERABLE')
    .reduce((s, t) => s + t.amountPaise, 0);

  // Rates
  const totalFailedRevenuePaise = totalRevenueRecoveredPaise + totalRevenueLostPaise + revenueAtRiskPaise;
  
  const transactionRecoveryRatePercent = totalFailedPayments > 0
    ? Math.round((successfullyRecovered / totalFailedPayments) * 100 * 10) / 10
    : 0;

  const revenueRecoveryRatePercent = totalFailedRevenuePaise > 0
    ? Math.round((totalRevenueRecoveredPaise / totalFailedRevenuePaise) * 100 * 10) / 10
    : 0;

  // Average recovery time
  let totalRecoveryTimeMins = 0;
  let recoveredCountWithTime = 0;
  for (const t of txns) {
    if (t.state === 'RECOVERED' && t.recoveredAt) {
      const created = new Date(t.createdAt).getTime();
      const recovered = new Date(t.recoveredAt).getTime();
      totalRecoveryTimeMins += Math.max(0, (recovered - created) / 60000);
      recoveredCountWithTime++;
    }
  }
  const averageRecoveryTimeMinutes = recoveredCountWithTime > 0 
    ? Math.round(totalRecoveryTimeMins / recoveredCountWithTime) 
    : 0;

  // Failure breakdown
  const failureBreakdown: Record<string, number> = {};
  for (const t of txns) {
    failureBreakdown[t.failureReason] = (failureBreakdown[t.failureReason] ?? 0) + 1;
  }

  // Strategy performance
  const strategyMap: Record<string, { attempts: number; recovered: number }> = {};
  for (const t of txns) {
    for (const attempt of t.recoveryAttempts) {
      if (!strategyMap[attempt.action]) strategyMap[attempt.action] = { attempts: 0, recovered: 0 };
      strategyMap[attempt.action].attempts++;
      if (attempt.result === 'SUCCESS') strategyMap[attempt.action].recovered++;
    }
  }
  const strategyPerformance = Object.entries(strategyMap).map(([action, data]) => ({
    action: action as RecoveryAction,
    attempts: data.attempts,
    recovered: data.recovered,
    successRate: data.attempts > 0 ? Math.round((data.recovered / data.attempts) * 100) : 0,
  }));

  // 7-day recovery trend from actual data
  const trendMap: Record<string, { failed: number, recovered: number, revenueLost: number, revenueRecovered: number }> = {};
  
  // Initialize last 7 days
  for (let i = 6; i >= 0; i--) {
    const d = new Date(NOW - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    trendMap[dateStr] = { failed: 0, recovered: 0, revenueLost: 0, revenueRecovered: 0 };
  }

  for (const t of txns) {
    const d = new Date(t.createdAt);
    const dateStr = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    if (trendMap[dateStr]) {
      if (t.state === 'RECOVERED') {
        trendMap[dateStr].recovered++;
        trendMap[dateStr].revenueRecovered += (t.recoveredAmountPaise ?? 0);
      } else {
        trendMap[dateStr].failed++;
        trendMap[dateStr].revenueLost += t.amountPaise;
      }
    }
  }

  const recoveryTrend = Object.entries(trendMap).map(([date, data]) => ({
    date,
    failed: data.failed,
    recovered: data.recovered,
    revenueLostPaise: data.revenueLost,
    revenueRecoveredPaise: data.revenueRecovered,
  }));

  return {
    totalTransactions,
    failedPayments: totalFailedPayments,
    recoverablePayments,
    successfullyRecovered,
    totalRevenueLostPaise,
    totalRevenueRecoveredPaise,
    revenueAtRiskPaise,
    transactionRecoveryRatePercent,
    revenueRecoveryRatePercent,
    averageRecoveryTimeMinutes,
    failureBreakdown,
    strategyPerformance,
    recoveryTrend,
  };
}
