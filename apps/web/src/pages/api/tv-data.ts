import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchKitcoSpot } from '@/lib/gold-spot';

function getApiBase() {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:4000';
}

const TGJU_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

interface TgjuPrices {
  geram18: string | null;
  ons:     string | null;
  mithqal: string | null;
  tedpix:  string | null;
}

async function fetchOneTgju(symbol: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.tgju.org/v1/market/indicator/summary-table-data/${symbol}`,
      { headers: { 'User-Agent': TGJU_UA }, signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return null;
    const json = await res.json();
    // API returns { data: { p: "218,396,000", ... } }
    const p = json?.data?.p ?? json?.response?.p ?? null;
    return typeof p === 'string' ? p : null;
  } catch { return null; }
}

async function fetchTgjuPrices(): Promise<TgjuPrices> {
  const [geram18, ons, mithqal, tedpix] = await Promise.all([
    fetchOneTgju('geram18'),
    fetchOneTgju('ons'),
    fetchOneTgju('mithqal'),
    fetchOneTgju('tedpix'),
  ]);
  return { geram18, ons, mithqal, tedpix };
}

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');

  const base = getApiBase();
  const [cRes, gRes, kitco, tgju] = await Promise.all([
    fetch(`${base}/api/currencies`, { signal: AbortSignal.timeout(5000) }).catch(() => null),
    fetch(`${base}/api/gold`,       { signal: AbortSignal.timeout(5000) }).catch(() => null),
    fetchKitcoSpot(),
    fetchTgjuPrices(),
  ]);

  const currencies = cRes?.ok ? await cRes.json() : [];
  const gold       = gRes?.ok ? await gRes.json() : [];
  const spot       = kitco ? { priceUsd: kitco.priceUsd, priceCad: kitco.priceCad } : null;

  res.json({ currencies, gold, spot, tgju });
}
