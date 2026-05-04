import type { Currency, GoldPrice, Product } from '@melli/types';

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
