import type { Currency, GoldPrice } from '@melli/types';

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
