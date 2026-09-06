'use client';

import { ScrollText, Info } from 'lucide-react';
import { useAppState } from '@/lib/store';
import { StateBadge } from '@/components/ui/Badges';
import { formatDateTime } from '@/lib/utils';
import { api } from '@/lib/api';
import { useState, useEffect } from 'react';
import { AuditLogEntry } from '@/lib/types';
import Link from 'next/link';
import { clsx } from 'clsx';

export default function AuditLogsPage() {
  const { transactions } = useAppState();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    async function loadLogs() {
      try {
        const data = await api.getAuditLogs();
        setLogs(data);
      } catch (e) {
        console.error("Failed to load audit logs:", e);
      }
    }
    loadLogs();
  }, []);

  const allLogs = logs
    .map(entry => ({ ...entry, txn: transactions.find(t => t.id === entry.transactionId) }))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="p-6 space-y-5 max-w-[1100px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Audit Logs</h1>
          <p className="text-sm text-slate-500 mt-1">
            Immutable log of all AI decisions, policy validations, and recovery actions
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
          <Info className="w-3.5 h-3.5" />
          DEMO DATA · {allLogs.length} events
        </div>
      </div>

      <div className="glass-card border border-slate-800 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/40 flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">All Events (newest first)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/30">
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-600 uppercase tracking-wider w-36">Timestamp</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-600 uppercase tracking-wider w-32">Transaction</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Event</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-600 uppercase tracking-wider">AI Decision</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Policy Decision</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Result</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-600 uppercase tracking-wider">State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {allLogs.map((entry) => (
                <tr key={entry.id} className="table-row-hover">
                  <td className="px-4 py-2.5 text-slate-600 font-mono whitespace-nowrap">
                    {formatDateTime(entry.timestamp).split(', ')[1] ?? ''}
                  </td>
                  <td className="px-4 py-2.5">
                    <Link href={`/transactions/${entry.transactionId}`} className="text-blue-400 hover:text-blue-300 font-mono truncate block max-w-[120px]">
                      {entry.transactionId}
                    </Link>
                    <div className="text-slate-600 truncate max-w-[120px]">{entry.txn?.customer.name || 'Unknown'}</div>
                  </td>
                  <td className="px-4 py-2.5 text-slate-300 max-w-[160px]">
                    <div className="truncate">{entry.event}</div>
                    {entry.action && <div className="text-slate-600 truncate">→ {entry.action}</div>}
                  </td>
                  <td className="px-4 py-2.5 max-w-[160px]">
                    {entry.aiDecision && (
                      <div className="text-blue-400 bg-blue-500/10 rounded px-1.5 py-0.5 border border-blue-500/20 truncate">
                        {entry.aiDecision}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2.5 max-w-[160px]">
                    {entry.policyDecision && (
                      <div className={clsx(
                        'rounded px-1.5 py-0.5 border truncate',
                        entry.policyDecision.includes('REJECTED')
                          ? 'text-red-400 bg-red-500/10 border-red-500/20'
                          : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                      )}>
                        {entry.policyDecision.slice(0, 50)}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 max-w-[120px]">
                    {entry.result && <span className="truncate block">{entry.result}</span>}
                    {entry.reason && <span className="text-slate-700 truncate block italic">{entry.reason}</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    <StateBadge state={entry.state} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {allLogs.length === 0 && (
            <div className="py-16 text-center text-slate-600 text-sm">No audit events yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
