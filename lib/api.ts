import type { AuditLogEntry, DashboardMetrics, FailureReason, PaymentMethod, RecoveryPolicy, Transaction } from './types';

const API_URL = 'http://localhost:8000/api';

export interface SimulateFailurePayload {
    amountPaise: number;
    paymentMethod: PaymentMethod;
    failureReason: FailureReason;
    customerId: string;
}

export const api = {
    async getTransactions(): Promise<Transaction[]> {
        const res = await fetch(`${API_URL}/transactions`);
        if (!res.ok) throw new Error("Failed to fetch transactions");
        return res.json();
    },
    async getTransaction(id: string): Promise<Transaction> {
        const res = await fetch(`${API_URL}/transactions/${id}`);
        if (!res.ok) throw new Error("Failed to fetch transaction");
        return res.json();
    },
    async getMetrics(): Promise<DashboardMetrics> {
        const res = await fetch(`${API_URL}/metrics`);
        if (!res.ok) throw new Error("Failed to fetch metrics");
        return res.json();
    },
    async getAuditLogs(): Promise<AuditLogEntry[]> {
        const res = await fetch(`${API_URL}/audit-logs`);
        if (!res.ok) throw new Error("Failed to fetch audit logs");
        return res.json();
    },
    async simulateFailure(data: SimulateFailurePayload): Promise<Transaction> {
        const res = await fetch(`${API_URL}/simulation/failure`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error("Failed to simulate failure");
        return res.json();
    },
    async recoverTransaction(id: string): Promise<Transaction> {
        const res = await fetch(`${API_URL}/transactions/${id}/recover`, {
            method: 'POST'
        });
        if (!res.ok) throw new Error("Failed to recover transaction");
        return res.json();
    },
    async getPolicies(): Promise<RecoveryPolicy[]> {
        const res = await fetch(`${API_URL}/policies`);
        if (!res.ok) throw new Error("Failed to fetch policies");
        return res.json();
    },
    async updatePolicy(data: RecoveryPolicy): Promise<RecoveryPolicy> {
        const res = await fetch(`${API_URL}/policies`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error("Failed to update policy");
        return res.json();
    }
};
