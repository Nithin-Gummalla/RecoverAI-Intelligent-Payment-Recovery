// RecoverAI — Deterministic Recovery Policy Engine
// ⚠️ CRITICAL: This module NEVER calls any AI or LLM.
// It enforces hard rules that the AI cannot override.
// Financial decisions are always made here, not by the AI.

import {
  AIDiagnosis,
  PolicyValidation,
  RecoveryAction,
  RecoveryPolicy,
  Transaction,
} from './types';
import { DEFAULT_RECOVERY_POLICY } from './synthetic-data';

/**
 * Validate an AI diagnosis recommendation against the deterministic recovery policy.
 * Returns a PolicyValidation object that either approves, rejects, or modifies the AI recommendation.
 * The AI recommendation is NEVER directly executed — it always passes through this function first.
 */
export function validateAIRecommendation(
  aiDiagnosis: AIDiagnosis,
  transaction: Transaction,
  policy: RecoveryPolicy = DEFAULT_RECOVERY_POLICY
): PolicyValidation {
  const recommendedAction = aiDiagnosis.recommendedStrategy;
  const recommendedRetries = aiDiagnosis.recommendedMaxRetries;

  // Rule 1: Check if action is in allowed channels
  const isChannelAllowed = policy.allowedChannels.includes(recommendedAction);
  if (!isChannelAllowed && recommendedAction !== 'STOP' && recommendedAction !== 'WAIT') {
    return {
      decision: 'REJECTED',
      approvedAction: 'SEND_PAYMENT_LINK', // safe deterministic fallback
      rejectionReason: `AI recommended "${recommendedAction}" but this channel is not enabled in merchant policy. Falling back to SEND_PAYMENT_LINK.`,
      appliedMaxRetries: 0,
    };
  }

  // Rule 2: Check amount thresholds for auto-retry
  if (recommendedAction === 'RETRY') {
    if (transaction.amountPaise < policy.minAmountForAutoRetryPaise) {
      return {
        decision: 'REJECTED',
        approvedAction: 'STOP',
        rejectionReason: `Amount ₹${transaction.amountPaise / 100} is below minimum auto-retry threshold of ₹${policy.minAmountForAutoRetryPaise / 100}.`,
        appliedMaxRetries: 0,
      };
    }

    if (transaction.amountPaise > policy.maxAmountForAutoRecoveryPaise) {
      return {
        decision: 'MODIFIED',
        approvedAction: 'SEND_PAYMENT_LINK',
        modificationReason: `Amount ₹${transaction.amountPaise / 100} exceeds auto-recovery threshold of ₹${policy.maxAmountForAutoRecoveryPaise / 100}. Switching to SEND_PAYMENT_LINK instead of auto-retry.`,
        appliedMaxRetries: 0,
      };
    }
  }

  // Rule 3: Check retry count — AI cannot exceed MAX_RETRIES
  if (recommendedAction === 'RETRY' && recommendedRetries > policy.maxRetries) {
    return {
      decision: 'REJECTED',
      approvedAction: 'RETRY',
      rejectionReason: `AI recommended ${recommendedRetries} retries but MAX_RETRIES policy = ${policy.maxRetries}. AI recommendation rejected by recovery policy. Applying policy maximum.`,
      appliedMaxRetries: policy.maxRetries,
    };
  }

  // Rule 4: Check voice is allowed
  if (recommendedAction === 'VOICE_CONTACT' && !policy.enableVoice) {
    return {
      decision: 'REJECTED',
      approvedAction: 'SEND_WHATSAPP',
      rejectionReason: 'Voice contact is disabled in merchant policy. Falling back to WhatsApp.',
      appliedMaxRetries: 0,
    };
  }

  // Rule 5: Check WhatsApp is allowed
  if (recommendedAction === 'SEND_WHATSAPP' && !policy.enableWhatsApp) {
    return {
      decision: 'MODIFIED',
      approvedAction: 'SEND_PAYMENT_LINK',
      modificationReason: 'WhatsApp is disabled in merchant policy. Using payment link instead.',
      appliedMaxRetries: 0,
    };
  }

  // All checks passed — approve AI recommendation
  return {
    decision: 'APPROVED',
    approvedAction: recommendedAction,
    appliedMaxRetries: recommendedRetries > 0 ? Math.min(recommendedRetries, policy.maxRetries) : policy.maxRetries,
  };
}

/**
 * Determine if we should stop recovery based on attempt count.
 * This is a DETERMINISTIC stopping rule — not controllable by AI.
 */
export function shouldStopRecovery(
  currentAttempts: number,
  policy: RecoveryPolicy = DEFAULT_RECOVERY_POLICY
): boolean {
  return currentAttempts >= policy.stopAfterFailures;
}

/**
 * Get the next action after a failed attempt.
 * Pure deterministic logic — no AI involvement.
 */
export function getNextDeterministicAction(
  currentAction: RecoveryAction,
  attemptNumber: number,
  policy: RecoveryPolicy = DEFAULT_RECOVERY_POLICY
): RecoveryAction {
  if (attemptNumber >= policy.stopAfterFailures) return 'STOP';

  // Fallback ladder (deterministic)
  const fallbackLadder: RecoveryAction[] = ['RETRY', 'SEND_PAYMENT_LINK', 'SEND_WHATSAPP', 'STOP'];
  const currentIdx = fallbackLadder.indexOf(currentAction);

  // Find next allowed action
  for (let i = currentIdx + 1; i < fallbackLadder.length; i++) {
    const next = fallbackLadder[i];
    if (next === 'STOP') return 'STOP';
    if (policy.allowedChannels.includes(next)) return next;
  }

  return 'STOP';
}
