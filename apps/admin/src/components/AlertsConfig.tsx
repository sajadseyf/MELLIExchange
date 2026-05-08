'use client';

import { useEffect, useState } from 'react';
import { Card, Button, Input } from '@melli/ui';
import { api, ApiError } from '@/lib/api';

interface AlertSettings {
  enabled: boolean;
  email: string;
  phone: string;
  thresholdPct: number;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  twilioSid: string;
  twilioToken: string;
  twilioFrom: string;
}

interface AlertLog {
  _id: string;
  currency: string;
  source: string;
  fromRate: number;
  toRate: number;
  changePct: number;
  message: string;
  sentEmail: boolean;
  sentSms: boolean;
  createdAt: string;
}

const DEFAULT: AlertSettings = {
  enabled: false, email: '', phone: '', thresholdPct: 0.5,
  smtpHost: '', smtpPort: 587, smtpUser: '', smtpPass: '',
  twilioSid: '', twilioToken: '', twilioFrom: '',
};

export function AlertsConfig() {
  const [cfg,    setCfg]    = useState<AlertSettings>(DEFAULT);
  const [logs,   setLogs]   = useState<AlertLog[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  useEffect(() => {
    api<any>('/api/settings').then((s) => {
      if (s.alerts) setCfg({ ...DEFAULT, ...s.alerts });
    }).catch(() => {});
    api<AlertLog[]>('/api/competitor/alerts').then(setLogs).catch(() => {});
  }, []);

  function set<K extends keyof AlertSettings>(k: K, v: AlertSettings[K]) {
    setCfg((prev) => ({ ...prev, [k]: v }));
  }

  async function save() {
    setSaving(true); setError(null);
    try {
      await api('/api/settings', { method: 'PATCH', body: JSON.stringify({ alerts: cfg }) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const fmtDate = (d: string) => new Date(d).toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-6">
        <h2 className="mb-6 font-semibold text-ink-900">Rate Alerts — SMS & Email</h2>

        {/* Master toggle */}
        <label className="mb-6 flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={cfg.enabled}
            onChange={(e) => set('enabled', e.target.checked)}
            className="h-4 w-4 rounded accent-gold-500"
          />
          <div>
            <p className="font-medium text-ink-800">Enable alerts</p>
            <p className="text-xs text-ink-400">Send SMS + email when any rate moves more than the threshold in one 30-min interval</p>
          </div>
        </label>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Alert targets */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-medium text-ink-700">Alert recipients</h3>
            <div>
              <label className="mb-1 block text-xs text-ink-500">Alert email</label>
              <Input value={cfg.email} onChange={(e) => set('email', e.target.value)} placeholder="alerts@melliexchange.ca" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-ink-500">Alert phone (E.164)</label>
              <Input value={cfg.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+16041234567" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-ink-500">Jump threshold (%)</label>
              <Input
                type="number" step="0.1" min="0.1" max="10"
                value={cfg.thresholdPct}
                onChange={(e) => set('thresholdPct', parseFloat(e.target.value))}
              />
            </div>
          </div>

          {/* SMTP */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-medium text-ink-700">Email (SMTP)</h3>
            <div>
              <label className="mb-1 block text-xs text-ink-500">SMTP host</label>
              <Input value={cfg.smtpHost} onChange={(e) => set('smtpHost', e.target.value)} placeholder="smtp.gmail.com" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs text-ink-500">Port</label>
                <Input type="number" value={cfg.smtpPort} onChange={(e) => set('smtpPort', Number(e.target.value))} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-ink-500">SMTP username</label>
              <Input value={cfg.smtpUser} onChange={(e) => set('smtpUser', e.target.value)} placeholder="your@email.com" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-ink-500">SMTP password / app password</label>
              <Input type="password" value={cfg.smtpPass} onChange={(e) => set('smtpPass', e.target.value)} placeholder="••••••••" />
            </div>
          </div>

          {/* Twilio */}
          <div className="flex flex-col gap-3 sm:col-span-2 md:col-span-1">
            <h3 className="text-sm font-medium text-ink-700">SMS (Twilio)</h3>
            <div>
              <label className="mb-1 block text-xs text-ink-500">Account SID</label>
              <Input value={cfg.twilioSid} onChange={(e) => set('twilioSid', e.target.value)} placeholder="ACxxxx" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-ink-500">Auth token</label>
              <Input type="password" value={cfg.twilioToken} onChange={(e) => set('twilioToken', e.target.value)} placeholder="••••••••" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-ink-500">From phone (E.164)</label>
              <Input value={cfg.twilioFrom} onChange={(e) => set('twilioFrom', e.target.value)} placeholder="+16045550000" />
            </div>
          </div>
        </div>

        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

        <div className="mt-6">
          <Button onClick={save} disabled={saving}>
            {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save alert settings'}
          </Button>
        </div>
      </Card>

      {/* Alert log */}
      <Card className="overflow-hidden">
        <div className="border-b border-ink-100 px-6 py-4">
          <h2 className="font-semibold text-ink-900">Alert Log</h2>
          <p className="text-xs text-ink-400">{logs.length} alerts recorded</p>
        </div>
        {logs.length === 0 ? (
          <p className="px-6 py-8 text-sm text-ink-400">No alerts fired yet.</p>
        ) : (
          <div className="divide-y divide-ink-50">
            {logs.slice(0, 50).map((log) => (
              <div key={log._id} className="flex items-start gap-4 px-6 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-ink-800">{log.currency}</span>
                    <span className={`text-xs font-medium ${log.changePct > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                      {log.changePct > 0 ? '+' : ''}{log.changePct.toFixed(2)}%
                    </span>
                    <span className="text-xs text-ink-400">via {log.source}</span>
                  </div>
                  <p className="text-xs text-ink-500">{log.fromRate.toFixed(4)} → {log.toRate.toFixed(4)}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-ink-400">{fmtDate(log.createdAt)}</p>
                  <div className="mt-0.5 flex gap-1.5">
                    <span className={`text-[10px] font-medium ${log.sentEmail ? 'text-emerald-600' : 'text-ink-300'}`}>✉ Email</span>
                    <span className={`text-[10px] font-medium ${log.sentSms ? 'text-emerald-600' : 'text-ink-300'}`}>📱 SMS</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
