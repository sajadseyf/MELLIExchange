import type { Currency, GoldPrice, Product, Post } from '@melli/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

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
