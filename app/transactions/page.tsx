'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Filter, ArrowUpDown, ArrowRight, Info } from 'lucide-react';
import { useAppState } from '@/lib/store';
import { StateBadge, FailureBadge, PaymentMethodBadge } from '@/components/ui/Badges';
import { formatINR, formatDateTime } from '@/lib/utils';
import { TransactionState, FailureReason, PaymentMethod } from '@/lib/types';
import { clsx } from 'clsx';

const STATE_FILTER_OPTIONS: { label: string; value: TransactionState | 'ALL' }[] = [
  { label: 'All States', value: 'ALL' },
  { label: 'Failed', value: 'FAILED' },
  { label: 'Recovered', value: 'RECOVERED' },
  { label: 'Stopped', value: 'STOPPED' },
  { label: 'Diagnosing', value: 'DIAGNOSING' },
  { label: 'Recoverable', value: 'RECOVERABLE' },
];

export default function TransactionsPage() {
  const { transactions } = useAppState();
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState<TransactionState | 'ALL'>('ALL');
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const filtered = useMemo(() => {
    return transactions
      .filter(t => {
        const matchSearch = !search ||
          t.customer.name.toLowerCase().includes(search.toLowerCase()) ||
          t.id.toLowerCase().includes(search.toLowerCase()) ||
          t.customer.email.toLowerCase().includes(search.toLowerCase());
        const matchState = stateFilter === 'ALL' || t.state === stateFilter;
        const matchMethod = methodFilter === 'ALL' || t.paymentMethod === methodFilter;
        return matchSearch && matchState && matchMethod;
      })
      .sort((a, b) => {
        if (sortBy === 'date') {
          const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          return sortDir === 'desc' ? -diff : diff;
        } else {
          const diff = a.amountPaise - b.amountPaise;
          return sortDir === 'desc' ? -diff : diff;
        }
      });
  }, [transactions, search, stateFilter, methodFilter, sortBy, sortDir]);

  function toggleSort(col: 'date' | 'amount') {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  }

  const recoveredCount = transactions.filter(t => t.state === 'RECOVERED').length;
  const failedCount = transactions.filter(t => t.state === 'FAILED' || t.state === 'STOPPED').length;
  const diagnosingCount = transactions.filter(t => t.state === 'DIAGNOSING').length;

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Transactions</h1>
          <p className="text-sm text-slate-500 mt-1">
            {transactions.length} total transactions · {recoveredCount} recovered · {failedCount} unresolved
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
          <Info className="w-3.5 h-3.5" />
          DEMO DATA
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', value: transactions.length, color: 'text-slate-300' },
          { label: 'Recovered', value: recoveredCount, color: 'text-emerald-400' },
          { label: 'Failed / Stopped', value: failedCount, color: 'text-red-400' },
          { label: 'In Progress', value: diagnosingCount, color: 'text-yellow-400' },
        ].map(s => (
          <div key={s.label} className="glass-card p-3 border border-slate-800 text-center">
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-600 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card p-4 border border-slate-800 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search customer, email, transaction ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* State filter */}
        <select
          value={stateFilter}
          onChange={e => setStateFilter(e.target.value as TransactionState | 'ALL')}
          className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
        >
          {STATE_FILTER_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Method filter */}
        <select
          value={methodFilter}
          onChange={e => setMethodFilter(e.target.value as PaymentMethod | 'ALL')}
          className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value="ALL">All Methods</option>
          <option value="UPI">UPI</option>
          <option value="CARD">Card</option>
          <option value="NET_BANKING">Net Banking</option>
          <option value="WALLET">Wallet</option>
          <option value="EMI">EMI</option>
        </select>

        <div className="text-xs text-slate-600 ml-auto">
          {filtered.length} results
        </div>
      </div>

      {/* Table */}
      <div className="glass-card border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/40">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Transaction
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Method
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Failure
                </th>
                <th
                  className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-slate-300 select-none"
                  onClick={() => toggleSort('amount')}
                >
                  <span className="flex items-center justify-end gap-1">
                    Amount <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  State
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-slate-300 select-none"
                  onClick={() => toggleSort('date')}
                >
                  <span className="flex items-center gap-1">
                    Date <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((txn) => (
                <tr key={txn.id} className="table-row-hover transition-all">
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs text-slate-400">{txn.id}</div>
                    <div className="text-xs text-slate-600 mt-0.5">{txn.merchantOrderId}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-xs font-bold text-slate-300 flex-shrink-0">
                        {txn.customer.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-200">{txn.customer.name}</div>
                        <div className="text-xs text-slate-500">{txn.customer.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <PaymentMethodBadge method={txn.paymentMethod} />
                  </td>
                  <td className="px-4 py-3">
                    <FailureBadge reason={txn.failureReason} />
                    <div className="text-xs font-mono text-slate-600 mt-0.5">{txn.failureCode}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className={clsx(
                      'text-sm font-bold',
                      txn.state === 'RECOVERED' ? 'text-emerald-400' : 'text-slate-300'
                    )}>
                      {formatINR(txn.amountPaise)}
                    </div>
                    {txn.state === 'RECOVERED' && (
                      <div className="text-xs text-emerald-500 mt-0.5">↩ Recovered</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StateBadge state={txn.state} />
                    {txn.policyValidation?.decision === 'REJECTED' && (
                      <div className="text-xs text-amber-500 mt-0.5">⚠ Policy override</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-slate-400">{formatDateTime(txn.createdAt)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/transactions/${txn.id}`}
                      className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all group"
                    >
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <div className="text-slate-600 text-sm">No transactions match your filters</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
