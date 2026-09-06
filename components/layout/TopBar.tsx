'use client';

import { Bell, Play, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useAppState } from '@/lib/store';
import { clsx } from 'clsx';

export function TopBar() {
  const { isDemoMode, toggleDemoMode } = useAppState();

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-900/50 flex items-center px-6 gap-4 flex-shrink-0">
      {/* Demo mode banner */}
      <div className={clsx(
        'flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border transition-all',
        isDemoMode
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          : 'bg-slate-800 border-slate-700 text-slate-400'
      )}>
        <span className={clsx(
          'w-1.5 h-1.5 rounded-full',
          isDemoMode ? 'bg-amber-400 pulse-slow' : 'bg-slate-500'
        )} />
        {isDemoMode ? 'DEMO MODE — Simulated Data' : 'Live Mode'}
      </div>

      <div className="flex-1" />

      {/* Run demo button */}
      <Link
        href="/simulation"
        className="flex items-center gap-2 px-4 py-1.5 rounded-lg btn-success text-white text-xs font-semibold"
      >
        <Play className="w-3 h-3" />
        Run Demo
      </Link>

      {/* Toggle demo mode */}
      <button
        onClick={toggleDemoMode}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-all"
      >
        <RefreshCw className="w-3 h-3" />
        {isDemoMode ? 'Exit Demo' : 'Demo Mode'}
      </button>

      {/* Notifications */}
      <button className="relative w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center hover:bg-slate-700 transition-all">
        <Bell className="w-4 h-4 text-slate-400" />
        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-400" />
      </button>

      {/* User avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white">
        M
      </div>
    </header>
  );
}
