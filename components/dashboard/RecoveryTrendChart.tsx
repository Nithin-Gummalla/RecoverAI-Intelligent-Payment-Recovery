'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { RecoveryTrendPoint } from '@/lib/types';

interface RecoveryTrendChartProps {
  data: RecoveryTrendPoint[];
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2.5 border border-slate-700 min-w-[140px]">
      <div className="text-xs font-semibold text-slate-400 mb-2">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-xs text-slate-400">{p.name}</span>
          </div>
          <span className="text-xs font-bold text-white">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export function RecoveryTrendChart({ data }: RecoveryTrendChartProps) {
  return (
    <div className="glass-card p-5 border border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Recovery Trend</h3>
          <p className="text-xs text-slate-500 mt-0.5">Failed vs Recovered — last 7 days</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-1.5 rounded-full bg-red-400 opacity-70" />
            <span className="text-slate-500">Failed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-slate-500">Recovered</span>
          </div>
        </div>
      </div>

      <div style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="failedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="recoveredGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="failed"
              name="Failed"
              stroke="#f87171"
              strokeWidth={2}
              fill="url(#failedGrad)"
              dot={false}
              activeDot={{ r: 4, fill: '#f87171' }}
            />
            <Area
              type="monotone"
              dataKey="recovered"
              name="Recovered"
              stroke="#34d399"
              strokeWidth={2}
              fill="url(#recoveredGrad)"
              dot={false}
              activeDot={{ r: 4, fill: '#34d399' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
