'use client';

import React, { useState } from 'react';
import { Shield, Save, Info, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { RecoveryPolicy } from '@/lib/types';
import { RECOVERY_ACTION_LABELS } from '@/lib/utils';
import { ActionBadge } from '@/components/ui/Badges';
import { clsx } from 'clsx';

export default function PoliciesPage() {
  const [policy, setPolicy] = useState<RecoveryPolicy | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    async function loadPolicy() {
      try {
        const policies = await api.getPolicies();
        if (policies.length > 0) {
          setPolicy(policies[0]);
        }
      } catch (e) {
        console.error("Failed to load policies", e);
      } finally {
        setLoading(false);
      }
    }
    loadPolicy();
  }, []);

  async function handleSave() {
    if (!policy) return;
    try {
      await api.updatePolicy(policy);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error("Failed to save policy", e);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-400">Loading policy...</div>
      </div>
    );
  }

  if (!policy) return null;

  function toggleChannel(action: RecoveryPolicy['allowedChannels'][number]) {
    setPolicy(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        allowedChannels: prev.allowedChannels.includes(action)
          ? prev.allowedChannels.filter(a => a !== action)
          : [...prev.allowedChannels, action],
      };
    });
  }

  return (
    <div className="p-6 space-y-5 max-w-[800px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Recovery Policies</h1>
          <p className="text-sm text-slate-500 mt-1">
            Deterministic rules that govern recovery behavior — AI cannot override these
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
          <Info className="w-3.5 h-3.5" />
          DEMO MODE
        </div>
      </div>

      {/* Warning banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <AlertTriangle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-400">
          <span className="text-blue-400 font-semibold">These policies are enforced deterministically. </span>
          The AI recovery engine cannot override these limits. Any AI recommendation that violates these rules
          will be rejected and the event will be logged in the audit trail.
        </div>
      </div>

      <div className="glass-card p-6 border border-slate-800 space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
          <Shield className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-200">Recovery Policy Configuration</h3>
        </div>

        {/* Retry limits */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Retry Limits</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400">Maximum Retries</label>
              <div className="text-xs text-slate-600 mb-1">AI cannot recommend more than this many retries</div>
              <input
                type="number"
                min={0}
                max={10}
                value={policy.maxRetries}
                onChange={e => setPolicy(p => p ? ({ ...p, maxRetries: parseInt(e.target.value) || 0 }) : p)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400">Stop After N Failures</label>
              <div className="text-xs text-slate-600 mb-1">Stop recovery after this many failed attempts</div>
              <input
                type="number"
                min={1}
                max={10}
                value={policy.stopAfterFailures}
                onChange={e => setPolicy(p => p ? ({ ...p, stopAfterFailures: parseInt(e.target.value) || 1 }) : p)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400">Retry Delay (minutes)</label>
              <div className="text-xs text-slate-600 mb-1">Wait time between retry attempts</div>
              <input
                type="number"
                min={1}
                max={60}
                value={policy.retryDelayMinutes}
                onChange={e => setPolicy(p => p ? ({ ...p, retryDelayMinutes: parseInt(e.target.value) || 1 }) : p)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-5 space-y-4">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount Thresholds</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400">Min Amount for Auto-Retry (₹)</label>
              <div className="text-xs text-slate-600 mb-1">Below this, no auto-retry</div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                <input
                  type="number"
                  min={0}
                  value={policy.minAmountForAutoRetryPaise / 100}
                  onChange={e => setPolicy(p => p ? ({ ...p, minAmountForAutoRetryPaise: (parseFloat(e.target.value) || 0) * 100 }) : p)}
                  className="w-full pl-7 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400">Max Amount for Auto-Recovery (₹)</label>
              <div className="text-xs text-slate-600 mb-1">Above this, use manual channel instead</div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                <input
                  type="number"
                  min={0}
                  value={policy.maxAmountForAutoRecoveryPaise / 100}
                  onChange={e => setPolicy(p => p ? ({ ...p, maxAmountForAutoRecoveryPaise: (parseFloat(e.target.value) || 0) * 100 }) : p)}
                  className="w-full pl-7 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-5 space-y-3">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Allowed Recovery Channels</h4>
          <div className="text-xs text-slate-600">AI can only recommend channels that are enabled here</div>
          <div className="grid grid-cols-3 gap-2">
            {(['RETRY', 'SEND_PAYMENT_LINK', 'SEND_WHATSAPP', 'VOICE_CONTACT', 'WAIT', 'STOP'] as const).map(action => {
              const isEnabled = policy.allowedChannels.includes(action);
              return (
                <button
                  key={action}
                  onClick={() => toggleChannel(action)}
                  className={clsx(
                    'flex items-center gap-2 p-3 rounded-lg border text-xs text-left transition-all',
                    isEnabled
                      ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                      : 'bg-slate-900 border-slate-700 text-slate-600'
                  )}
                >
                  <div className={clsx(
                    'w-3.5 h-3.5 rounded border-2 flex-shrink-0 flex items-center justify-center',
                    isEnabled ? 'border-blue-400 bg-blue-500' : 'border-slate-600'
                  )}>
                    {isEnabled && <span className="text-[8px] text-white font-bold">✓</span>}
                  </div>
                  {RECOVERY_ACTION_LABELS[action]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-slate-800 pt-5 space-y-3">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Communication Channels</h4>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={policy.enableWhatsApp}
                onChange={e => setPolicy(p => p ? ({ ...p, enableWhatsApp: e.target.checked }) : p)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-800 accent-blue-500"
              />
              <span className="text-xs text-slate-400">Enable WhatsApp</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={policy.enableVoice}
                onChange={e => setPolicy(p => p ? ({ ...p, enableVoice: e.target.checked }) : p)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-800 accent-blue-500"
              />
              <span className="text-xs text-slate-400">Enable Voice Contact</span>
            </label>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-5">
          <button
            onClick={handleSave}
            className={clsx(
              'flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all',
              saved
                ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                : 'btn-primary text-white'
            )}
          >
            <Save className="w-4 h-4" />
            {saved ? '✓ Saved!' : 'Save Policy Changes'}
          </button>
          <p className="text-xs text-slate-600 mt-2">
            In demo mode, policy changes affect the simulation but are not persisted to a database.
          </p>
        </div>
      </div>

      {/* Current policy summary */}
      <div className="glass-card p-5 border border-slate-800">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Current Policy Summary</h4>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Max retries</span>
            <span className="text-slate-200 font-bold">{policy.maxRetries}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Stop after failures</span>
            <span className="text-slate-200 font-bold">{policy.stopAfterFailures}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Min retry amount</span>
            <span className="text-slate-200 font-bold">₹{policy.minAmountForAutoRetryPaise / 100}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Max auto-recovery</span>
            <span className="text-slate-200 font-bold">₹{(policy.maxAmountForAutoRecoveryPaise / 100).toLocaleString('en-IN')}</span>
          </div>
          <div className="col-span-2 flex items-center gap-2 flex-wrap">
            <span className="text-slate-500 flex-shrink-0">Allowed channels:</span>
            {policy.allowedChannels.map(a => <ActionBadge key={a} action={a} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
