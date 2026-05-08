'use client';

import { useEffect, useState } from 'react';
import { ArrowPathIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Button, Card, Input } from '@melli/ui';
import { api, ApiError } from '@/lib/api';

const CURRENCY_SOURCES = [
  { value: 'vanex_scrape',        label: 'VanEx Group',           note: 'vanexgroup.com — retail CAD rates (scrape)', free: true },
  { value: 'vbce_scrape',         label: 'VBCE',                  note: 'vbce.ca — retail CAD rates (scrape)', free: true },
  { value: 'bank_of_canada',      label: 'Bank of Canada',        note: 'Official daily CAD rates — very reliable', free: true },
  { value: 'frankfurter',         label: 'Frankfurter',           note: 'Free ECB daily rates, history back to 1999', free: true },
  { value: 'open_er_api',         label: 'open.er-api.com',       note: 'Free daily rates, no history', free: true },
  { value: 'open_exchange_rates', label: 'Open Exchange Rates',   note: 'Paid — $12/mo, hourly, historical', free: false },
  { value: 'currency_api',        label: 'CurrencyAPI',           note: 'Paid — $10/mo, CAD base, historical', free: false },
] as const;

const GOLD_SOURCES = [
  { value: 'kitco',         label: 'Kitco (kitco.com)',     note: 'Free · scrape spot bid/ask · most accurate', free: true },
  { value: 'vbce_metal',    label: 'VBCE Metal Rates',      note: 'Free · CAD native · same source as currency', free: true },
  { value: 'yahoo_finance', label: 'Yahoo Finance (GC=F)',  note: 'Free · gold futures · 15 min delay', free: true },
  { value: 'metals_api',    label: 'Metals-API',            note: 'Paid — $20/mo, realtime, includes CAD', free: false },
  { value: 'gold_api',      label: 'GoldAPI.io',            note: 'Free tier available, realtime spot', free: false },
] as const;

type CurrencySourceValue = (typeof CURRENCY_SOURCES)[number]['value'];
type GoldSourceValue = (typeof GOLD_SOURCES)[number]['value'];

interface Settings {
  currencySource: CurrencySourceValue;
  goldSource: GoldSourceValue;
  spread: number;
  hasApiKeys: {
    open_exchange_rates: boolean;
    currency_api: boolean;
    metals_api: boolean;
    gold_api: boolean;
  };
}

const API_KEY_FIELDS: Array<{
  key: keyof Settings['hasApiKeys'];
  label: string;
  forSource: string[];
}> = [
  { key: 'open_exchange_rates', label: 'Open Exchange Rates API key', forSource: ['open_exchange_rates'] },
  { key: 'currency_api',        label: 'CurrencyAPI key',             forSource: ['currency_api'] },
  { key: 'metals_api',          label: 'Metals-API key',              forSource: ['metals_api'] },
  { key: 'gold_api',            label: 'GoldAPI.io key',              forSource: ['gold_api'] },
];

export function SettingsPanel() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [currencySource, setCurrencySource] = useState<CurrencySourceValue>('vanex_scrape');
  const [goldSource, setGoldSource] = useState<GoldSourceValue>('yahoo_finance');
  const [spread, setSpread] = useState('1.5');
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const data = await api<Settings>('/api/settings');
    setSettings(data);
    setCurrencySource(data.currencySource);
    setGoldSource(data.goldSource);
    setSpread(String(data.spread));
  }

  useEffect(() => {
    reload().catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load settings'));
  }, []);

  async function save() {
    setError(null);
    setSaving(true);
    setSaved(false);
    try {
      await api('/api/settings', {
        method: 'PUT',
        body: JSON.stringify({
          currencySource,
          goldSource,
          spread: parseFloat(spread) || 1.5,
          apiKeys,
        }),
      });
      setSaved(true);
      await reload();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function syncNow() {
    setError(null);
    setSyncing(true);
    try {
      await api('/api/settings/sync', { method: 'POST' });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  }

  const neededKeys = API_KEY_FIELDS.filter(
    (f) => f.forSource.includes(currencySource) || f.forSource.includes(goldSource),
  );

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-ink-100 px-6 py-4">
        <h2 className="font-serif text-xl text-ink-900">Price Sources</h2>
        <p className="text-sm text-ink-500">
          Choose where live rates are fetched from — updates run every 15 minutes
        </p>
      </div>

      {error && (
        <div className="border-b border-ink-100 bg-red-50 px-6 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="divide-y divide-ink-100">
        {/* Currency source */}
        <div className="px-6 py-5">
          <h3 className="mb-3 text-sm font-semibold text-ink-700">Currency rates source</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {CURRENCY_SOURCES.map((src) => (
              <label
                key={src.value}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                  currencySource === src.value
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-ink-200 hover:border-ink-300'
                }`}
              >
                <input
                  type="radio"
                  name="currencySource"
                  value={src.value}
                  checked={currencySource === src.value}
                  onChange={() => setCurrencySource(src.value)}
                  className="mt-0.5 accent-amber-500"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-ink-900">{src.label}</span>
                    {src.free ? (
                      <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-700">
                        Free
                      </span>
                    ) : (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                        Paid
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-ink-500">{src.note}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Gold source */}
        <div className="px-6 py-5">
          <h3 className="mb-3 text-sm font-semibold text-ink-700">Gold price source</h3>
          <div className="grid gap-2 sm:grid-cols-3">
            {GOLD_SOURCES.map((src) => (
              <label
                key={src.value}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                  goldSource === src.value
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-ink-200 hover:border-ink-300'
                }`}
              >
                <input
                  type="radio"
                  name="goldSource"
                  value={src.value}
                  checked={goldSource === src.value}
                  onChange={() => setGoldSource(src.value)}
                  className="mt-0.5 accent-amber-500"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-ink-900">{src.label}</span>
                    {src.free ? (
                      <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-700">
                        Free
                      </span>
                    ) : (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                        Paid
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-ink-500">{src.note}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Spread */}
        <div className="px-6 py-5">
          <h3 className="mb-1 text-sm font-semibold text-ink-700">Exchange spread</h3>
          <p className="mb-3 text-xs text-ink-500">
            Applied as ±% around the mid rate for buy/sell prices (only for mid-rate sources like
            Bank of Canada, Frankfurter, open.er-api). VanEx and VBCE use their own retail rates.
          </p>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={0}
              max={10}
              step={0.1}
              value={spread}
              onChange={(e) => setSpread(e.target.value)}
              className="w-28"
            />
            <span className="text-sm text-ink-600">%</span>
            <span className="text-xs text-ink-400">
              e.g. 1.5% → USD buy $
              {((parseFloat(spread) || 0) > 0
                ? (1.37 * (1 - parseFloat(spread) / 100)).toFixed(4)
                : '—'
              )}, sell $
              {((parseFloat(spread) || 0) > 0
                ? (1.37 * (1 + parseFloat(spread) / 100)).toFixed(4)
                : '—'
              )}
            </span>
          </div>
        </div>

        {/* API keys — only shown when a paid source is selected */}
        {neededKeys.length > 0 && (
          <div className="px-6 py-5">
            <h3 className="mb-1 text-sm font-semibold text-ink-700">API keys</h3>
            <p className="mb-3 text-xs text-ink-500">
              Keys are stored securely — leave blank to keep the existing value.
            </p>
            <div className="flex flex-col gap-3">
              {neededKeys.map((f) => (
                <div key={f.key}>
                  <label className="mb-1 block text-xs font-medium text-ink-600">
                    {f.label}
                    {settings?.hasApiKeys[f.key] && (
                      <span className="ml-2 text-emerald-600">(saved)</span>
                    )}
                  </label>
                  <Input
                    type="password"
                    placeholder={settings?.hasApiKeys[f.key] ? '••••••••••••' : 'Enter API key'}
                    value={apiKeys[f.key] ?? ''}
                    onChange={(e) =>
                      setApiKeys((prev) => ({ ...prev, [f.key]: e.target.value }))
                    }
                    className="max-w-md font-mono text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 px-6 py-4">
          <Button
            onClick={syncNow}
            disabled={syncing}
            variant="secondary"
            size="sm"
          >
            <ArrowPathIcon className={`mr-1.5 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing…' : 'Sync now'}
          </Button>

          <Button onClick={save} disabled={saving}>
            {saved ? (
              <>
                <CheckIcon className="mr-1.5 h-4 w-4" />
                Saved
              </>
            ) : saving ? (
              'Saving…'
            ) : (
              'Save settings'
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
