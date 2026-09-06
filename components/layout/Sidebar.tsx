'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CreditCard,
  RefreshCw,
  FlaskConical,
  Brain,
  ScrollText,
  Shield,
  Settings,
  Zap,
} from 'lucide-react';
import { clsx } from 'clsx';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: CreditCard },
  { href: '/recovery', label: 'Recovery Center', icon: RefreshCw },
  { href: '/simulation', label: 'Simulation', icon: FlaskConical },
  { href: '/ai-decisions', label: 'AI Decisions', icon: Brain },
  { href: '/audit-logs', label: 'Audit Logs', icon: ScrollText },
  { href: '/policies', label: 'Policies', icon: Shield },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 flex-shrink-0 h-screen bg-slate-900/80 border-r border-slate-800 flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-wide">RecoverAI</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest">Payment Recovery</div>
          </div>
        </div>
      </div>

      {/* Merchant info */}
      <div className="px-4 py-3 border-b border-slate-800/60">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-slate-800/40">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">
            M
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-slate-200 truncate">Demo Merchant</div>
            <div className="text-[10px] text-slate-500">merchant_demo</div>
          </div>
          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5">
        <div className="text-[10px] uppercase tracking-widest text-slate-600 px-3 pb-2 pt-1">
          Navigation
        </div>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'nav-item flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all',
                isActive
                  ? 'active text-blue-400 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <Icon className={clsx('w-4 h-4 flex-shrink-0', isActive ? 'text-blue-400' : 'text-slate-500')} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-800">
        <div className="text-[10px] text-slate-600 text-center">
          Razorpay AI Buildathon 2026
        </div>
      </div>
    </aside>
  );
}
