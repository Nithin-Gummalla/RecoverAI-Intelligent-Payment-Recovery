// RecoverAI — Global Store (Updated for Milestone 2 API Integration)
'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Transaction, DashboardMetrics } from './types';
import { api } from './api';

interface AppState {
  transactions: Transaction[];
  metrics: DashboardMetrics | null;
  isDemoMode: boolean;
  setTransactions: (txns: Transaction[]) => void;
  addTransaction: (txn: Transaction) => void;
  updateTransaction: (id: string, update: Partial<Transaction>) => void;
  toggleDemoMode: () => void;
  refreshMetrics: () => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactionsState] = useState<Transaction[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(true);

  const refreshMetrics = useCallback(async () => {
    try {
      const data = await api.getMetrics();
      setMetrics(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      const txns = await api.getTransactions();
      setTransactionsState(txns);
      await refreshMetrics();
    } catch (e) {
      console.error("Failed to load data from API:", e);
    }
  }, [refreshMetrics]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const setTransactions = useCallback((txns: Transaction[]) => {
    setTransactionsState(txns);
  }, []);

  const addTransaction = useCallback((txn: Transaction) => {
    setTransactionsState(prev => [txn, ...prev]);
    refreshMetrics();
  }, [refreshMetrics]);

  const updateTransaction = useCallback((id: string, update: Partial<Transaction>) => {
    setTransactionsState(prev =>
      prev.map(t => t.id === id ? { ...t, ...update } : t)
    );
    refreshMetrics();
  }, [refreshMetrics]);

  const toggleDemoMode = useCallback(() => {
    setIsDemoMode(prev => !prev);
  }, []);

  return (
    <AppContext.Provider value={{
      transactions,
      metrics,
      isDemoMode,
      setTransactions,
      addTransaction,
      updateTransaction,
      toggleDemoMode,
      refreshMetrics,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppState(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
}
