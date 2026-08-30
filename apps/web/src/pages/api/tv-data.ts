import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchKitcoSpot } from '@/lib/gold-spot';

function getApiBase() {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:4000';
}

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');

  const base = getApiBase();
  const [cRes, gRes, kitco] = await Promise.all([
    fetch(`${base}/api/currencies`, { signal: AbortSignal.timeout(5000) }).catch(() => null),
    fetch(`${base}/api/gold`,       { signal: AbortSignal.timeout(5000) }).catch(() => null),
    fetchKitcoSpot(),
  ]);

  const currencies = cRes?.ok ? await cRes.json() : [];
  const gold       = gRes?.ok ? await gRes.json() : [];
  const spot       = kitco ? { priceUsd: kitco.priceUsd, priceCad: kitco.priceCad } : null;

  res.json({ currencies, gold, spot });
}
