import { Router } from 'express';

const router = Router();

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

// Simple in-memory cache — 15 min TTL
let cache: { items: NewsItem[]; fetchedAt: number } | null = null;
const CACHE_TTL = 15 * 60 * 1000;

const RSS_FEEDS = [
  { url: 'https://www.fxstreet.com/rss/news', label: 'FXStreet', key: 'fxstreet' },
];

function stripCdata(s: string): string {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '').trim();
}

function extractTag(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  return m ? stripCdata(m[1] ?? '') : '';
}

function detectCategory(title: string): string {
  const t = title.toUpperCase();
  if (/GOLD|XAU|SILVER|XAG/.test(t)) return 'gold';
  if (/CAD|CANADA/.test(t)) return 'cad';
  if (/EUR/.test(t)) return 'eur';
  if (/GBP|POUND|STERLING/.test(t)) return 'gbp';
  if (/JPY|YEN/.test(t)) return 'jpy';
  if (/OIL|WTI|CRUDE/.test(t)) return 'oil';
  if (/USD|DOLLAR/.test(t)) return 'usd';
  return 'fx';
}

async function fetchRSS(url: string, label: string, key: string): Promise<NewsItem[]> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/rss+xml, application/xml, text/xml' },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`${label} RSS ${res.status}`);
  const xml = await res.text();

  const items: NewsItem[] = [];
  for (const [, body] of [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]) {
    if (!body) continue;
    const title     = extractTag(body, 'title');
    const desc      = extractTag(body, 'description');
    const link      = extractTag(body, 'link');
    const pubDate   = extractTag(body, 'pubDate');
    if (!title || !link) continue;
    items.push({
      title,
      description: desc.slice(0, 280),
      link,
      pubDate,
      source: key,
      sourceLabel: label,
      image: null,
      category: detectCategory(title),
    });
  }
  return items;
}

async function fetchVBCE(): Promise<NewsItem[]> {
  const res = await fetch(
    'https://strapi-admin.vbce.ca/marketwatches?_sort=published_at:desc&_limit=10',
    {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Origin': 'https://www.vbce.ca', 'Referer': 'https://www.vbce.ca/' },
      signal: AbortSignal.timeout(8000),
    },
  );
  if (!res.ok) throw new Error(`VBCE ${res.status}`);
  const articles = (await res.json()) as Array<{
    title: string;
    excerpt?: string;
    description?: string;
    url?: string;
    slug?: string;
    published_at?: string;
    featured_image?: { formats?: { small?: { url: string }; medium?: { url: string } }; url?: string };
  }>;

  return articles.map((a) => ({
    title: a.title,
    description: (a.excerpt ?? a.description ?? '').replace(/\*\*/g, '').slice(0, 280),
    link: `https://www.vbce.ca${a.url ?? `/marketwatch/${a.slug}`}`,
    pubDate: a.published_at ?? '',
    source: 'vbce',
    sourceLabel: 'VBCE',
    image: a.featured_image?.formats?.small?.url ?? a.featured_image?.formats?.medium?.url ?? a.featured_image?.url ?? null,
    category: detectCategory(a.title),
  }));
}

async function getNews(): Promise<NewsItem[]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) return cache.items;

  const tasks = [
    fetchVBCE(),
    ...RSS_FEEDS.map((f) => fetchRSS(f.url, f.label, f.key)),
  ];

  const results = await Promise.allSettled(tasks);
  const items: NewsItem[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') items.push(...r.value);
    else console.warn('[news] feed failed:', r.reason);
  }

  items.sort((a, b) => {
    const da = a.pubDate ? new Date(a.pubDate).getTime() : 0;
    const db = b.pubDate ? new Date(b.pubDate).getTime() : 0;
    return db - da;
  });

  const top = items.slice(0, 50);
  cache = { items: top, fetchedAt: Date.now() };
  return top;
}

router.get('/', async (_req, res) => {
  try {
    const items = await getNews();
    res.json(items);
  } catch (e) {
    console.error('[news]', e);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

export default router;
