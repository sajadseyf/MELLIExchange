import type { Currency, GoldPrice, Product, Post, FaqItem } from '@melli/types';

function getApiBase() {
  if (typeof window !== 'undefined') return '';
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}
const API_URL = getApiBase();

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    next: { revalidate: 30 },
  });
  if (!res.ok) throw new Error(`API ${path} -> ${res.status}`);
  return (await res.json()) as T;
}

export async function getCurrencies(): Promise<Currency[]> {
  try {
    return await fetchJson<Currency[]>('/api/currencies');
  } catch {
    return [];
  }
}

export async function getGoldPrices(): Promise<GoldPrice[]> {
  try {
    return await fetchJson<GoldPrice[]>('/api/gold');
  } catch {
    return [];
  }
}

export async function getProducts(): Promise<Product[]> {
  try {
    return await fetchJson<Product[]>('/api/products');
  } catch {
    return [];
  }
}

export interface GoldHistoryPoint {
  date: string;
  k14?: number;
  k18?: number;
  k22?: number;
  k24?: number;
}

export async function getGoldHistory(days = 30): Promise<GoldHistoryPoint[]> {
  try {
    return await fetchJson<GoldHistoryPoint[]>(`/api/gold/history?days=${days}`);
  } catch {
    return [];
  }
}

export async function getPosts(): Promise<Post[]> {
  try {
    return await fetchJson<Post[]>('/api/posts');
  } catch {
    return [];
  }
}

export async function getPost(slug: string): Promise<Post | null> {
  try {
    return await fetchJson<Post>(`/api/posts/${slug}`);
  } catch {
    return null;
  }
}

export interface CurrencyHistoryPoint {
  date: string;
  buy: number;
  sell: number;
}

export async function getCurrencyHistory(code: string, days = 30): Promise<CurrencyHistoryPoint[]> {
  try {
    return await fetchJson<CurrencyHistoryPoint[]>(`/api/currencies/history?code=${code}&days=${days}`);
  } catch {
    return [];
  }
}

export interface SpotPrice {
  priceUsd: number;
  priceCad: number;
  change24h: number;
  bid: number;
  ask: number;
  recordedAt: string;
}

export async function getGoldSpotPrice(): Promise<SpotPrice | null> {
  // Import inline to avoid bundling issues — this runs only on the server (Vercel)
  const { fetchKitcoSpot } = await import('./gold-spot');
  const kitco = await fetchKitcoSpot();
  if (kitco) {
    return {
      priceUsd:  kitco.priceUsd,
      priceCad:  kitco.priceCad,
      bid:       kitco.bid,
      ask:       kitco.ask,
      change24h: 0,
      recordedAt: new Date().toISOString(),
    };
  }
  // Fallback to Express/MongoDB if Kitco is unavailable
  try {
    const data = await fetchJson<{ gold: SpotPrice | null; silver: SpotPrice | null }>('/api/spot/latest');
    return data.gold;
  } catch {
    return null;
  }
}

export interface NewsItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
  sourceLabel: string;
  image: string | null;
  category: string;
}

export async function getMarketNews(): Promise<NewsItem[]> {
  try {
    return await fetchJson<NewsItem[]>('/api/news');
  } catch {
    return [];
  }
}

export async function getFaqs(): Promise<FaqItem[]> {
  try {
    return await fetchJson<FaqItem[]>('/api/faq');
  } catch {
    return [];
  }
}
