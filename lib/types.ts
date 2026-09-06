// RecoverAI — Core Type Definitions
// All financial operations use deterministic code; AI only provides recommendations

export type TransactionState =
  | 'FAILED'
  | 'DIAGNOSING'
  | 'RECOVERABLE'
  | 'NON_RECOVERABLE'
  | 'STRATEGY_SELECTED'
  | 'ACTION_EXECUTED'
  | 'WAITING_FOR_RESULT'
  | 'RECOVERED'
  | 'FAILED_AGAIN'
  | 'STOPPED';

export type FailureReason =
  | 'INSUFFICIENT_FUNDS'
  | 'CARD_DECLINED'
  | 'NETWORK_FAILURE'
  | 'AUTH_FAILURE'
  | 'EXPIRED_CARD'
  | 'TIMEOUT'
  | 'CUSTOMER_ABANDONED'
  | 'UNKNOWN';

export type PaymentMethod = 'UPI' | 'CARD' | 'NET_BANKING' | 'WALLET' | 'EMI';

export type RecoveryAction =
  | 'RETRY'
  | 'SEND_PAYMENT_LINK'
  | 'SEND_WHATSAPP'
  | 'VOICE_CONTACT'
  | 'WAIT'
  | 'STOP';

export type Recoverability = 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';

export type PolicyDecision = 'APPROVED' | 'REJECTED' | 'MODIFIED';

// ---- Customer ----
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  totalSpent: number; // in paise
}

// ---- AI Diagnosis (structured JSON — validated before use) ----
export interface AIDiagnosis {
  failureCategory: FailureReason;
  recoverability: Recoverability;
  confidencePercent: number;
  reason: string;
  recommendedStrategy: RecoveryAction;
  recommendedMaxRetries: number;
  fallbackStrategy: RecoveryAction;
  explanation: {
    failureClassification: string;
    customerHistory: string;
    transactionContext: string;
    conclusion: string;
  };
}

// ---- Policy Validation Result ----
export interface PolicyValidation {
  decision: PolicyDecision;
  approvedAction: RecoveryAction;
  rejectionReason?: string;
  modificationReason?: string;
  appliedMaxRetries: number;
}

// ---- Audit Log Entry ----
export interface AuditLogEntry {
  id: string;
  transactionId: string;
  timestamp: string;
  event: string;
  aiDecision?: string;
  policyDecision?: string;
  action?: string;
  result?: string;
  reason?: string;
  state: TransactionState;
}

// ---- Recovery Attempt ----
export interface RecoveryAttempt {
  id: string;
  transactionId: string;
  attemptNumber: number;
  action: RecoveryAction;
  timestamp: string;
  result: 'SUCCESS' | 'FAILED' | 'PENDING';
  reason?: string;
}

// ---- Transaction ----
export interface Transaction {
  id: string;
  customer: Customer;
  amountPaise: number; // always store in paise for accuracy
  paymentMethod: PaymentMethod;
  failureReason: FailureReason;
  failureCode: string;
  createdAt: string;
  updatedAt: string;
  state: TransactionState;
  merchantOrderId: string;
  razorpayPaymentId?: string;

  // Recovery data
  aiDiagnosis?: AIDiagnosis;
  policyValidation?: PolicyValidation;
  recoveryAttempts: RecoveryAttempt[];
  recoveredAmountPaise?: number;
  recoveredAt?: string;

  // Audit trail
  auditLog: AuditLogEntry[];
}

// ---- Recovery Policy (merchant-configured, deterministic) ----
export interface RecoveryPolicy {
  id: string;
  merchantId: string;
  maxRetries: number;
  minAmountForAutoRetryPaise: number; // minimum amount to attempt auto-retry
  maxAmountForAutoRecoveryPaise: number; // max amount for auto recovery
  allowedChannels: RecoveryAction[];
  stopAfterFailures: number;
  retryDelayMinutes: number;
  enableWhatsApp: boolean;
  enableVoice: boolean;
}

// ---- Dashboard Metrics ----
export interface DashboardMetrics {
  totalTransactions: number;
  failedPayments: number;
  recoverablePayments: number;
  successfullyRecovered: number;
  totalRevenueLostPaise: number; // Permanently lost
  totalRevenueRecoveredPaise: number; // Successfully recovered
  revenueAtRiskPaise: number; // Actively pending recovery
  transactionRecoveryRatePercent: number;
  revenueRecoveryRatePercent: number;
  averageRecoveryTimeMinutes: number;
  failureBreakdown: Record<FailureReason, number>;
  strategyPerformance: StrategyPerformance[];
  recoveryTrend: RecoveryTrendPoint[];
}

export interface StrategyPerformance {
  action: RecoveryAction;
  attempts: number;
  recovered: number;
  successRate: number;
}

export interface RecoveryTrendPoint {
  date: string;
  failed: number;
  recovered: number;
  revenueLostPaise: number;
  revenueRecoveredPaise: number;
}

// ---- Simulation Run Result ----
export interface SimulationRun {
  id: string;
  startedAt: string;
  completedAt?: string;
  totalFailed: number;
  recoverable: number;
  recovered: number;
  nonRecoverable: number;
  stoppedByPolicy: number;
  revenueAtRiskPaise: number;
  revenueRecoveredPaise: number;
  recoveryRatePercent: number;
  strategyPerformance: StrategyPerformance[];
  transactions: Transaction[];
}
