import type { NextApiRequest, NextApiResponse } from 'next';

const TROY_OZ_GRAMS = 31.1035;

// Fetch BID/ASK from Kitco — returns mid price (bid+ask)/2
async function fetchGoldFromKitco(): Promise<{ mid: number; bid: number; ask: number } | null> {
  try {
    const res = await fetch('https://www.kitco.com/charts/gold', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5.1 Safari/605.1.15',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(7000),
    });
    if (!res.ok) return null;
    const html = await res.text();

    // Kitco embeds gold spot in __NEXT_DATA__ under symbol:"AU"
    const goldSection = html.match(/"symbol"\s*:\s*"AU"[^[]+\[([^\]]+)\]/);
    if (goldSection) {
      const askM = goldSection[1]!.match(/"ask"\s*:\s*([\d.]+)/);
      const bidM = goldSection[1]!.match(/"bid"\s*:\s*([\d.]+)/);
      const ask  = askM ? parseFloat(askM[1]!) : 0;
      const bid  = bidM ? parseFloat(bidM[1]!) : 0;
      if (ask > 1000 && bid > 1000) {
        return { mid: (bid + ask) / 2, bid, ask };
      }
    }
    return null;
  } catch {
    return null;
  }
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

  const [kitco, usdCad] = await Promise.all([fetchGoldFromKitco(), fetchUsdCad()]);

  if (!kitco) {
    res.status(503).json({ error: 'Gold price unavailable' });
    return;
  }

  const cadPerOz = kitco.mid * usdCad;

  res.json({
    priceUsd: Math.round(kitco.mid * 100) / 100,
    bid:      Math.round(kitco.bid  * 100) / 100,
    ask:      Math.round(kitco.ask  * 100) / 100,
    priceCad: Math.round(cadPerOz   * 100) / 100,
    usdCad:   Math.round(usdCad * 10000) / 10000,
    karats: {
      10: Math.round(cadPerOz / TROY_OZ_GRAMS * (10 / 24) * 100) / 100,
      14: Math.round(cadPerOz / TROY_OZ_GRAMS * (14 / 24) * 100) / 100,
      18: Math.round(cadPerOz / TROY_OZ_GRAMS * (18 / 24) * 100) / 100,
      22: Math.round(cadPerOz / TROY_OZ_GRAMS * (22 / 24) * 100) / 100,
      24: Math.round(cadPerOz / TROY_OZ_GRAMS           * 100) / 100,
    },
  });
}
