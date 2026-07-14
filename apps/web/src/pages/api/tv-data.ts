import type { NextApiRequest, NextApiResponse } from 'next';

function getApiBase() {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:4000';
}

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');

  const base = getApiBase();
  const [cRes, gRes, sRes] = await Promise.allSettled([
    fetch(`${base}/api/currencies`, { signal: AbortSignal.timeout(5000) }),
    fetch(`${base}/api/gold`,       { signal: AbortSignal.timeout(5000) }),
    fetch(`${base}/api/spot/latest`,{ signal: AbortSignal.timeout(5000) }),
  ]);

  const currencies = cRes.status === 'fulfilled' && cRes.value.ok ? await cRes.value.json() : [];
  const gold       = gRes.status === 'fulfilled' && gRes.value.ok ? await gRes.value.json() : [];
  const spotData   = sRes.status === 'fulfilled' && sRes.value.ok ? await sRes.value.json() : null;

  res.json({ currencies, gold, spot: spotData?.gold ?? null });
}
