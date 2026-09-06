'use client';

import { ReactNode } from 'react';
import { clsx } from 'clsx';
import { LucideIcon } from 'lucide-react';
import { formatINR, formatINRShort } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: { value: number; label: string };
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'purple';
  isCurrency?: boolean;
  children?: ReactNode;
}

const VARIANT_STYLES = {
  default: {
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-400',
    border: 'border-slate-800',
    glow: '',
  },
  success: {
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
    border: 'border-emerald-500/20',
    glow: 'glow-green',
  },
  danger: {
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-400',
    border: 'border-red-500/20',
    glow: '',
  },
  warning: {
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
    border: 'border-amber-500/20',
    glow: '',
  },
  purple: {
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-400',
    border: 'border-violet-500/20',
    glow: 'glow-purple',
  },
};

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  isCurrency = false,
}: MetricCardProps) {
  const styles = VARIANT_STYLES[variant];

  const displayValue = isCurrency && typeof value === 'number'
    ? formatINRShort(value)
    : value;

  return (
    <div className={clsx(
      'glass-card p-5 metric-card',
      styles.glow,
      `border ${styles.border}`
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center', styles.iconBg)}>
          <Icon className={clsx('w-4 h-4', styles.iconColor)} />
        </div>
        {trend && (
          <div className={clsx(
            'flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
            trend.value >= 0
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-red-500/10 text-red-400'
          )}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className={clsx(
          'text-2xl font-bold tracking-tight',
          variant === 'success' ? 'gradient-text-success' :
          variant === 'purple' ? 'text-violet-300' :
          'text-slate-100'
        )}>
          {displayValue}
        </div>
        <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          {title}
        </div>
        {subtitle && (
          <div className="text-xs text-slate-600 mt-1">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Big hero metric card ----
export function HeroMetricCard({
  title,
  valuePaise,
  subtitle,
  recoveryRate,
}: {
  title: string;
  valuePaise: number;
  subtitle: string;
  recoveryRate: number;
}) {
  return (
    <div className="glass-card p-6 glow-green border border-emerald-500/20 col-span-2">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-semibold uppercase tracking-widest text-emerald-500">
          {title}
        </div>
        <div className="text-xs text-slate-500">
          {subtitle}
        </div>
      </div>
      <div className="text-4xl font-black gradient-text-success tracking-tight">
        {formatINR(valuePaise)}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full transition-all duration-1000"
            style={{ width: `${Math.min(recoveryRate, 100)}%` }}
          />
        </div>
        <div className="text-sm font-semibold text-emerald-400">
          {recoveryRate}% recovery rate
        </div>
      </div>
    </div>
  );
}
