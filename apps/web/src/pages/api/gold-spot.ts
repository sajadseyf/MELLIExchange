import type { NextApiRequest, NextApiResponse } from 'next';

const TROY_OZ_GRAMS = 31.1035;

async function fetchGoldUSD(): Promise<number | null> {
  const sources = [
    async () => {
      const res = await fetch(
        'https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&range=2d',
        { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(5000) },
      );
      if (!res.ok) return null;
      const d = await res.json();
      const price = d?.chart?.result?.[0]?.meta?.regularMarketPrice;
      return price && price > 1000 ? price : null;
    },
    async () => {
      const res = await fetch(
        'https://query2.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&range=2d',
        { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(5000) },
      );
      if (!res.ok) return null;
      const d = await res.json();
      const price = d?.chart?.result?.[0]?.meta?.regularMarketPrice;
      return price && price > 1000 ? price : null;
    },
  ];

  for (const fn of sources) {
    try {
      const p = await fn();
      if (p) return p;
    } catch { /* next */ }
  }
  return null;
}

async function fetchUsdCad(): Promise<number> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: AbortSignal.timeout(4000),
    });
    const d = await res.json();
    if (d.result === 'success' && d.rates?.CAD) return d.rates.CAD;
  } catch { /* fallback */ }
  return 1.42;
}

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');

  const [goldUSD, usdCad] = await Promise.all([fetchGoldUSD(), fetchUsdCad()]);

  if (!goldUSD) {
    res.status(503).json({ error: 'Gold price unavailable' });
    return;
  }

  const cadPerOz = goldUSD * usdCad;

  res.json({
    priceUsd: Math.round(goldUSD * 100) / 100,
    priceCad: Math.round(cadPerOz * 100) / 100,
    usdCad:   Math.round(usdCad * 4) / 4,
    karats: {
      10: Math.round(cadPerOz / TROY_OZ_GRAMS * (10 / 24) * 100) / 100,
      14: Math.round(cadPerOz / TROY_OZ_GRAMS * (14 / 24) * 100) / 100,
      18: Math.round(cadPerOz / TROY_OZ_GRAMS * (18 / 24) * 100) / 100,
      22: Math.round(cadPerOz / TROY_OZ_GRAMS * (22 / 24) * 100) / 100,
      24: Math.round(cadPerOz / TROY_OZ_GRAMS * 100) / 100,
    },
  });
}
