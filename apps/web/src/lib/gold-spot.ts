const TROY_OZ_GRAMS = 31.1035;

export interface KitcoSpot {
  priceUsd: number;
  priceCad: number;
  bid: number;
  ask: number;
}

async function fetchUsdCad(): Promise<number> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(4000),
    });
    const d = await res.json();
    if (d.result === 'success' && d.rates?.CAD) return d.rates.CAD;
  } catch { /* fallback */ }
  return 1.42;
}

export async function fetchKitcoSpot(): Promise<KitcoSpot | null> {
  try {
    const res = await fetch('https://www.kitco.com/charts/gold', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5.1 Safari/605.1.15',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const html = await res.text();

    const goldSection = html.match(/"symbol"\s*:\s*"AU"[^[]+\[([^\]]+)\]/);
    if (!goldSection) return null;
    const askM = goldSection[1]!.match(/"ask"\s*:\s*([\d.]+)/);
    const bidM = goldSection[1]!.match(/"bid"\s*:\s*([\d.]+)/);
    const ask = askM ? parseFloat(askM[1]!) : 0;
    const bid = bidM ? parseFloat(bidM[1]!) : 0;
    if (ask <= 1000 || bid <= 1000) return null;

    const priceUsd = (bid + ask) / 2;
    const usdCad = await fetchUsdCad();

    return {
      priceUsd: Math.round(priceUsd * 100) / 100,
      priceCad: Math.round(priceUsd * usdCad * 100) / 100,
      bid: Math.round(bid * 100) / 100,
      ask: Math.round(ask * 100) / 100,
    };
  } catch {
    return null;
  }
}

export function kitcoToKarats(spot: KitcoSpot) {
  const cadPerOz = spot.priceCad;
  return {
    10: Math.round(cadPerOz / TROY_OZ_GRAMS * (10 / 24) * 100) / 100,
    14: Math.round(cadPerOz / TROY_OZ_GRAMS * (14 / 24) * 100) / 100,
    18: Math.round(cadPerOz / TROY_OZ_GRAMS * (18 / 24) * 100) / 100,
    22: Math.round(cadPerOz / TROY_OZ_GRAMS * (22 / 24) * 100) / 100,
    24: Math.round(cadPerOz / TROY_OZ_GRAMS           * 100) / 100,
  };
}
