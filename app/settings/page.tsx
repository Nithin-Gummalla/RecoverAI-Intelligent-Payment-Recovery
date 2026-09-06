'use client';

import { Settings, Info } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-5 max-w-[700px] mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Merchant and integration configuration</p>
      </div>

      <div className="glass-card p-6 border border-slate-800 space-y-5">
        <h3 className="text-sm font-semibold text-slate-200">Merchant Profile</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Merchant Name', value: 'Demo Merchant', type: 'text' },
            { label: 'Merchant ID', value: 'merchant_demo', type: 'text', readonly: true },
            { label: 'Business Email', value: 'merchant@demo.com', type: 'email' },
            { label: 'Support Phone', value: '+91 98765 43210', type: 'text' },
          ].map(f => (
            <div key={f.label} className="space-y-1.5">
              <label className="text-xs text-slate-500 uppercase tracking-wide">{f.label}</label>
              <input
                type={f.type}
                defaultValue={f.value}
                readOnly={f.readonly}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500 read-only:opacity-50"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-6 border border-slate-800">
        <h3 className="text-sm font-semibold text-slate-200 mb-4">Razorpay Integration</h3>
        <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 mb-4">
          <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-400">
            Razorpay Payment Links run only when the backend is configured with Test Mode credentials.
            Without them, RecoverAI remains fully usable in Simulation Mode and never exposes credentials to this page.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {[
            { label: 'Razorpay Key ID', placeholder: 'rzp_test_...' },
            { label: 'Razorpay Key Secret', placeholder: '••••••••••••••••' },
            { label: 'Webhook Secret', placeholder: 'whsec_...' },
          ].map(f => (
            <div key={f.label} className="space-y-1.5">
              <label className="text-xs text-slate-500 uppercase tracking-wide">{f.label}</label>
              <input
                type="password"
                placeholder={f.placeholder}
                disabled
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-600 placeholder-slate-700 opacity-50 cursor-not-allowed"
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-600 mt-3">⚠️ Never commit API keys. Use environment variables (.env.local)</p>
      </div>
    </div>
  );
}
