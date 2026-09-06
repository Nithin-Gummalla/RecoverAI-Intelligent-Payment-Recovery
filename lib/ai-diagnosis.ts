// RecoverAI — Simulated AI Diagnosis Service
// In production this calls an LLM API with structured JSON output.
// For Milestone 1, we return deterministic simulated responses that mirror
// what the LLM would return, including the structured JSON schema.
// The output is always validated before use — invalid output triggers safe fallback.

import { AIDiagnosis, FailureReason, PaymentMethod, Transaction } from './types';

/**
 * Failure categories that are generally recoverable (transient).
 */
const TRANSIENT_FAILURES: FailureReason[] = [
  'NETWORK_FAILURE',
  'TIMEOUT',
  'UNKNOWN',
];

/**
 * Failure categories that are generally NOT recoverable (permanent).
 */
const PERMANENT_FAILURES: FailureReason[] = [
  'INSUFFICIENT_FUNDS',
  'EXPIRED_CARD',
  'CARD_DECLINED',
];

/**
 * Simulate AI diagnosis for a given transaction.
 * Returns structured JSON matching our AIDiagnosis schema.
 * In production: send transaction context to LLM, validate response.
 */
export function simulateAIDiagnosis(transaction: Transaction): AIDiagnosis {
  const { failureReason, amountPaise, customer, paymentMethod } = transaction;

  // --- Determine recoverability based on failure type ---
  const isTransient = TRANSIENT_FAILURES.includes(failureReason);
  const isPermanent = PERMANENT_FAILURES.includes(failureReason);
  const isAbandoned = failureReason === 'CUSTOMER_ABANDONED';
  const isAuthFailure = failureReason === 'AUTH_FAILURE';

  // Customer trust score (higher = more likely to recover)
  const successRate = customer.totalTransactions > 0
    ? customer.successfulTransactions / customer.totalTransactions
    : 0;
  const isHighValueCustomer = customer.totalTransactions >= 5;
  const isNewCustomer = customer.totalTransactions <= 1;

  // ---- Recoverability logic ----
  let recoverability: AIDiagnosis['recoverability'];
  let confidencePercent: number;
  let reason: string;
  let recommendedStrategy: AIDiagnosis['recommendedStrategy'];
  let recommendedMaxRetries: number;
  let fallbackStrategy: AIDiagnosis['fallbackStrategy'];

  if (isPermanent && failureReason === 'INSUFFICIENT_FUNDS') {
    recoverability = 'NONE';
    confidencePercent = 94;
    reason = 'Insufficient funds confirmed. Auto-retry will not resolve this. Customer needs to add money first.';
    recommendedStrategy = 'STOP';
    recommendedMaxRetries = 0;
    fallbackStrategy = 'STOP';
  } else if (failureReason === 'EXPIRED_CARD') {
    recoverability = 'NONE';
    confidencePercent = 98;
    reason = 'Card is expired. No payment method available. Recovery not possible without customer action.';
    recommendedStrategy = 'SEND_PAYMENT_LINK';
    recommendedMaxRetries = 0;
    fallbackStrategy = 'STOP';
  } else if (failureReason === 'CARD_DECLINED') {
    recoverability = successRate > 0.7 ? 'LOW' : 'NONE';
    confidencePercent = 87;
    reason = successRate > 0.7
      ? 'Card declined — possibly a temporary bank block. Customer has good history. Try payment link.'
      : 'Card declined with low success history. Recovery unlikely.';
    recommendedStrategy = 'SEND_PAYMENT_LINK';
    recommendedMaxRetries = 0;
    fallbackStrategy = 'STOP';
  } else if (isTransient && isHighValueCustomer) {
    recoverability = 'HIGH';
    confidencePercent = Math.round(85 + successRate * 12);
    reason = `Temporary technical failure. Customer has ${customer.successfulTransactions} successful payments — strong recovery candidate.`;
    recommendedStrategy = 'RETRY';
    recommendedMaxRetries = 2;
    fallbackStrategy = 'SEND_PAYMENT_LINK';
  } else if (isTransient && !isNewCustomer) {
    recoverability = 'HIGH';
    confidencePercent = 82;
    reason = 'Transient network or timeout error. Auto-retry after delay is the best strategy.';
    recommendedStrategy = 'RETRY';
    recommendedMaxRetries = 2;
    fallbackStrategy = 'SEND_PAYMENT_LINK';
  } else if (isTransient && isNewCustomer) {
    recoverability = 'MEDIUM';
    confidencePercent = 68;
    reason = 'Transient failure but customer is new — uncertain history. Send payment link to be safe.';
    recommendedStrategy = 'SEND_PAYMENT_LINK';
    recommendedMaxRetries = 1;
    fallbackStrategy = 'STOP';
  } else if (isAbandoned) {
    recoverability = 'MEDIUM';
    confidencePercent = 61;
    reason = 'Customer abandoned checkout. Intent unclear. Send a friendly reminder with payment link.';
    recommendedStrategy = 'SEND_WHATSAPP';
    recommendedMaxRetries = 0;
    fallbackStrategy = 'SEND_PAYMENT_LINK';
  } else if (isAuthFailure) {
    recoverability = 'MEDIUM';
    confidencePercent = 74;
    reason = 'OTP or authentication failure — customer may have mis-typed. Payment link gives them a fresh attempt.';
    recommendedStrategy = 'SEND_PAYMENT_LINK';
    recommendedMaxRetries = 0;
    fallbackStrategy = 'STOP';
  } else {
    recoverability = 'MEDIUM';
    confidencePercent = 65;
    reason = 'Unknown failure reason — moderate recovery chance. Sending payment link is the safest approach.';
    recommendedStrategy = 'SEND_PAYMENT_LINK';
    recommendedMaxRetries = 1;
    fallbackStrategy = 'STOP';
  }

  // Build explanation (structured — not hallucinated)
  const explanation = {
    failureClassification: getFailureClassificationText(failureReason, isTransient, isPermanent),
    customerHistory: `Customer "${customer.name}" has ${customer.successfulTransactions} successful out of ${customer.totalTransactions} total payments (${Math.round(successRate * 100)}% success rate).`,
    transactionContext: getTransactionContextText(amountPaise, paymentMethod, recoverability),
    conclusion: getConclusionText(recommendedStrategy, recommendedMaxRetries, fallbackStrategy),
  };

  return {
    failureCategory: failureReason,
    recoverability,
    confidencePercent,
    reason,
    recommendedStrategy,
    recommendedMaxRetries,
    fallbackStrategy,
    explanation,
  };
}

function getFailureClassificationText(
  reason: FailureReason,
  isTransient: boolean,
  isPermanent: boolean
): string {
  if (isTransient) return `Classified as TRANSIENT error — "${reason}" indicates a temporary technical condition, not a customer financial constraint.`;
  if (isPermanent) return `Classified as PERMANENT failure — "${reason}" indicates a customer-side financial or card constraint. Retry is unlikely to succeed.`;
  return `Classified as UNCERTAIN failure — "${reason}" may or may not be recoverable. Conservative strategy applied.`;
}

function getTransactionContextText(
  amountPaise: number,
  method: PaymentMethod,
  recoverability: AIDiagnosis['recoverability']
): string {
  const amount = `₹${(amountPaise / 100).toLocaleString('en-IN')}`;
  const methodLabel = method === 'UPI' ? 'UPI' : method === 'CARD' ? 'card payment' : method;
  return `Transaction of ${amount} via ${methodLabel}. Amount is ${amountPaise > 500000 ? 'high-value' : 'within normal range'} — ${recoverability === 'HIGH' ? 'qualifies for automatic recovery.' : 'manual or payment-link recovery preferred.'}`;
}

function getConclusionText(
  strategy: AIDiagnosis['recommendedStrategy'],
  maxRetries: number,
  fallback: AIDiagnosis['fallbackStrategy']
): string {
  if (strategy === 'RETRY') {
    return `Recommended: Auto-retry (max ${maxRetries} attempts). If retry fails, fall back to ${fallback === 'SEND_PAYMENT_LINK' ? 'sending a payment link' : fallback}.`;
  }
  if (strategy === 'SEND_PAYMENT_LINK') {
    return `Recommended: Send payment link to customer. This gives them a fresh attempt without auto-retry risks.`;
  }
  if (strategy === 'SEND_WHATSAPP') {
    return `Recommended: Send personalized WhatsApp message with payment link to re-engage the customer.`;
  }
  if (strategy === 'STOP') {
    return `Recommended: Stop recovery. Further attempts are unlikely to succeed and may frustrate the customer.`;
  }
  return `Recovery strategy to be determined based on customer response.`;
}

/**
 * Validate that an AI diagnosis response conforms to the expected schema.
 * Returns true if valid, false if invalid (triggers safe fallback).
 */
export function validateAIDiagnosisSchema(diagnosis: unknown): diagnosis is AIDiagnosis {
  if (!diagnosis || typeof diagnosis !== 'object') return false;
  const d = diagnosis as Record<string, unknown>;

  const validRecoverabilities = ['HIGH', 'MEDIUM', 'LOW', 'NONE'];
  const validStrategies = ['RETRY', 'SEND_PAYMENT_LINK', 'SEND_WHATSAPP', 'VOICE_CONTACT', 'WAIT', 'STOP'];

  if (!validRecoverabilities.includes(d.recoverability as string)) return false;
  if (!validStrategies.includes(d.recommendedStrategy as string)) return false;
  if (typeof d.confidencePercent !== 'number') return false;
  if (d.confidencePercent < 0 || d.confidencePercent > 100) return false;
  if (typeof d.reason !== 'string') return false;
  if (typeof d.recommendedMaxRetries !== 'number') return false;
  if (d.recommendedMaxRetries < 0) return false; // cannot be negative

  return true;
}

/**
 * Safe fallback diagnosis when AI output is invalid.
 * Always returns a conservative, safe response.
 */
export function getSafeFallbackDiagnosis(failureReason: FailureReason): AIDiagnosis {
  return {
    failureCategory: failureReason,
    recoverability: 'LOW',
    confidencePercent: 50,
    reason: 'AI diagnosis unavailable or invalid. Using safe deterministic fallback — sending payment link.',
    recommendedStrategy: 'SEND_PAYMENT_LINK',
    recommendedMaxRetries: 0,
    fallbackStrategy: 'STOP',
    explanation: {
      failureClassification: 'AI output validation failed — could not determine failure classification.',
      customerHistory: 'Customer history unavailable for this diagnosis.',
      transactionContext: 'Using conservative recovery strategy as AI output was invalid.',
      conclusion: 'Safe fallback: Send payment link. This event has been logged in the audit trail.',
    },
  };
}
