'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface NewsItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
  sourceLabel: string;
  image: string | null;
  category: string;
}

const CATEGORY_GRADIENT: Record<string, string> = {
  gold: 'from-amber-400 to-yellow-600',
  cad:  'from-red-500 to-red-700',
  usd:  'from-green-600 to-emerald-800',
  eur:  'from-blue-500 to-indigo-700',
  gbp:  'from-purple-500 to-purple-800',
  jpy:  'from-rose-400 to-red-600',
  oil:  'from-stone-500 to-stone-700',
  fx:   'from-slate-500 to-slate-700',
};

const CATEGORY_ICON: Record<string, string> = {
  gold: '🥇', cad: '🍁', usd: '💵', eur: '🇪🇺',
  gbp: '🇬🇧', jpy: '🇯🇵', oil: '🛢️', fx: '📊',
};

const SOURCE_BADGE: Record<string, string> = {
  vbce:     'bg-red-600 text-white',
  fxstreet: 'bg-blue-600 text-white',
  kitco:    'bg-amber-500 text-white',
};

function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(dateStr).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
}

function NewsCard({ item }: { item: NewsItem }) {
  const grad = CATEGORY_GRADIENT[item.category] ?? CATEGORY_GRADIENT.fx!;
  const icon = CATEGORY_ICON[item.category] ?? '📰';
  const badge = SOURCE_BADGE[item.source] ?? 'bg-ink-600 text-white';

  return (
    <a href={item.link} target="_blank" rel="noopener noreferrer" className="group">
      <div className="flex h-full flex-col overflow-hidden rounded-xl border border-ink-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
        {item.image ? (
          <div className="h-36 overflow-hidden">
            <img src={item.image} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          </div>
        ) : (
          <div className={`flex h-36 items-center justify-center bg-gradient-to-br ${grad}`}>
            <span className="text-5xl drop-shadow">{icon}</span>
          </div>
        )}
        <div className="flex flex-1 flex-col gap-1.5 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${badge}`}>
              {item.sourceLabel}
            </span>
            <span className="text-[10px] text-ink-400">{timeAgo(item.pubDate)}</span>
          </div>
          <h3 className="flex-1 text-xs font-semibold leading-snug text-ink-800 group-hover:text-gold-700 line-clamp-3">
            {item.title}
          </h3>
          {item.description && (
            <p className="text-[10px] leading-relaxed text-ink-400 line-clamp-2">{item.description}</p>
          )}
        </div>
      </div>
    </a>
  );
}

type Filter = 'all' | 'vbce' | 'fxstreet' | 'kitco';

export function NewsAnalysisPanel() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    api<NewsItem[]>('/api/news')
      .then(setItems)
      .catch((e) => setError(e?.message ?? 'Failed to load news'))
      .finally(() => setLoading(false));
  }, []);

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all',      label: `All (${items.length})` },
    { key: 'vbce',     label: `VBCE (${items.filter(i => i.source === 'vbce').length})` },
    { key: 'fxstreet', label: `FXStreet (${items.filter(i => i.source === 'fxstreet').length})` },
  ];

  const filtered = filter === 'all' ? items : items.filter(i => i.source === filter);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              filter === f.key ? 'bg-gold-500 text-white' : 'bg-ink-100 text-ink-500 hover:bg-ink-200'
            }`}
          >
            {f.label}
          </button>
        ))}
        {!loading && (
          <span className="ml-auto text-xs text-ink-400">Cached 15 min · {filtered.length} articles</span>
        )}
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-ink-100">
              <div className="h-36 animate-pulse bg-ink-100" />
              <div className="flex flex-col gap-2 p-3">
                <div className="h-2.5 w-16 animate-pulse rounded bg-ink-200" />
                <div className="h-3 w-full animate-pulse rounded bg-ink-100" />
                <div className="h-3 w-4/5 animate-pulse rounded bg-ink-100" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink-400">No articles found.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item, i) => <NewsCard key={i} item={item} />)}
        </div>
      )}
    </div>
  );
}
