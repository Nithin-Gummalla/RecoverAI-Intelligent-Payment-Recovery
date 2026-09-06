'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { FAILURE_REASON_LABELS, FAILURE_COLORS } from '@/lib/utils';
import { FailureReason } from '@/lib/types';

interface FailureBreakdownChartProps {
  data: Record<string, number>;
}

const RADIAN = Math.PI / 180;
interface PieLabelProps {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
}

function CustomLabel({
  cx = 0,
  cy = 0,
  midAngle = 0,
  innerRadius = 0,
  outerRadius = 0,
  percent = 0,
}: PieLabelProps) {
  if (percent < 0.05) return null;
  
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold" style={{ fontSize: 11 }}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { fill: string } }> }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 border border-slate-700">
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: payload[0].payload.fill }} />
        <span className="text-xs font-medium text-slate-200">{payload[0].name}</span>
      </div>
      <div className="text-sm font-bold text-white mt-0.5">{payload[0].value} transactions</div>
    </div>
  );
}

export function FailureBreakdownChart({ data }: FailureBreakdownChartProps) {
  const chartData = Object.entries(data)
    .map(([reason, count]) => ({
      name: FAILURE_REASON_LABELS[reason as FailureReason] ?? reason,
      value: count,
      fill: FAILURE_COLORS[reason as FailureReason] ?? '#94a3b8',
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="glass-card p-5 border border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Failure Breakdown</h3>
          <p className="text-xs text-slate-500 mt-0.5">By failure category</p>
        </div>
        <span className="text-xs text-slate-600 bg-slate-800 px-2 py-1 rounded border border-slate-700">
          Last 7 days
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1" style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
                dataKey="value"
                labelLine={false}
                label={CustomLabel}
              >
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} opacity={0.9} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex-shrink-0 space-y-1.5">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.fill }} />
              <span className="text-xs text-slate-400 whitespace-nowrap">{item.name}</span>
              <span className="text-xs font-semibold text-slate-300 ml-auto pl-2">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
