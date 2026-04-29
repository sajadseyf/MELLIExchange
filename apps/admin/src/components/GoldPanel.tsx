'use client';

import { useEffect, useState } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import { Button, Card, Input } from '@melli/ui';
import type { GoldPrice, GoldKarat } from '@melli/types';
import { api, ApiError } from '@/lib/api';

const KARATS: GoldKarat[] = [18, 22, 24];

export function GoldPanel() {
  const [items, setItems] = useState<GoldPrice[]>([]);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [savingKarat, setSavingKarat] = useState<number | null>(null);

  async function reload() {
    const data = await api<GoldPrice[]>('/api/gold');
    setItems(data);
    setDrafts(Object.fromEntries(data.map((d) => [d.karat, String(d.pricePerGram)])));
  }

  useEffect(() => {
    reload().catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load'));
  }, []);

  async function save(karat: GoldKarat) {
    setError(null);
    setSavingKarat(karat);
    try {
      await api(`/api/gold/${karat}`, {
        method: 'PUT',
        body: JSON.stringify({ pricePerGram: Number(drafts[karat] ?? 0) }),
      });
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    } finally {
      setSavingKarat(null);
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-ink-100 px-6 py-4">
        <h2 className="font-serif text-xl text-ink-900">Gold prices</h2>
        <p className="text-sm text-ink-500">Price per gram in CAD</p>
      </div>
      {error && (
        <div className="border-b border-ink-100 bg-burgundy/5 px-6 py-3 text-sm text-burgundy">
          {error}
        </div>
      )}
      <div className="grid gap-4 p-6 sm:grid-cols-3">
        {KARATS.map((karat) => {
          const item = items.find((i) => i.karat === karat);
          return (
            <div key={karat} className="rounded-xl2 border border-ink-100 p-5">
              <div className="mb-3 flex items-baseline justify-between">
                <span className="font-serif text-2xl text-ink-900">{karat}k</span>
                {item && (
                  <span className="text-xs text-ink-400">
                    Updated {new Date(item.updatedAt).toLocaleString()}
                  </span>
                )}
              </div>
              <div className="flex items-end gap-2">
                <Input
                  label="CAD / gram"
                  type="number"
                  step="0.01"
                  value={drafts[karat] ?? ''}
                  onChange={(e) => setDrafts({ ...drafts, [karat]: e.target.value })}
                  className="flex-1"
                />
                <Button onClick={() => save(karat)} disabled={savingKarat === karat}>
                  <CheckIcon className="h-4 w-4" />
                  Save
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
