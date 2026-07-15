import type { NextApiRequest, NextApiResponse } from 'next';

function getApiBase() {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:4000';
}

function getSelfBase(req: NextApiRequest) {
  const proto = req.headers['x-forwarded-proto'] ?? 'http';
  const host  = req.headers['x-forwarded-host'] ?? req.headers.host ?? 'localhost:3000';
  return `${proto}://${host}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');

  const base = getApiBase();
  const self = getSelfBase(req);

  const [cRes, gRes, sRes] = await Promise.allSettled([
    fetch(`${base}/api/currencies`,  { signal: AbortSignal.timeout(5000) }),
    fetch(`${base}/api/gold`,        { signal: AbortSignal.timeout(5000) }),
    // Use live Kitco price (same source as the main gold page) instead of stale MongoDB
    fetch(`${self}/api/gold-spot`,   { signal: AbortSignal.timeout(8000) }),
  ]);

  const currencies = cRes.status === 'fulfilled' && cRes.value.ok ? await cRes.value.json() : [];
  const gold       = gRes.status === 'fulfilled' && gRes.value.ok ? await gRes.value.json() : [];
  const kitco      = sRes.status === 'fulfilled' && sRes.value.ok ? await sRes.value.json() : null;

  const spot = kitco ? { priceUsd: kitco.priceUsd, priceCad: kitco.priceCad } : null;

  res.json({ currencies, gold, spot });
}
