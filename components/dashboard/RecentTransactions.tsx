'use client';

import Link from 'next/link';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { Transaction } from '@/lib/types';
import { StateBadge, FailureBadge, PaymentMethodBadge } from '@/components/ui/Badges';
import { formatINR, formatRelativeTime } from '@/lib/utils';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const recent = [...transactions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  return (
    <div className="glass-card border border-slate-800">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Recent Transactions</h3>
          <p className="text-xs text-slate-500 mt-0.5">Latest payment events</p>
        </div>
        <Link
          href="/transactions"
          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="divide-y divide-slate-800/60">
        {recent.map((txn) => (
          <Link
            key={txn.id}
            href={`/transactions/${txn.id}`}
            className="flex items-center gap-4 px-5 py-3.5 table-row-hover transition-all group"
          >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-xs font-bold text-slate-300 flex-shrink-0">
              {txn.customer.name.charAt(0)}
            </div>

            {/* Customer + amount */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-200 truncate">
                  {txn.customer.name}
                </span>
                <PaymentMethodBadge method={txn.paymentMethod} />
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-slate-500">{txn.id}</span>
                <span className="text-slate-700">·</span>
                <span className="text-xs text-slate-500">{formatRelativeTime(txn.createdAt)}</span>
              </div>
            </div>

            {/* Amount */}
            <div className="text-right flex-shrink-0">
              <div className={`text-sm font-bold ${txn.state === 'RECOVERED' ? 'text-emerald-400' : 'text-slate-300'}`}>
                {txn.state === 'RECOVERED' && <span className="text-xs mr-1">↩</span>}
                {formatINR(txn.amountPaise)}
              </div>
              <div className="mt-0.5">
                <StateBadge state={txn.state} />
              </div>
            </div>

            <ArrowRight className="w-3.5 h-3.5 text-slate-700 group-hover:text-slate-500 transition-colors flex-shrink-0" />
          </Link>
        ))}
      </div>

      {recent.length === 0 && (
        <div className="py-12 text-center text-slate-600">
          <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No transactions yet</p>
        </div>
      )}
    </div>
  );
}
