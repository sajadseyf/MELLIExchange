import type { NextApiRequest, NextApiResponse } from 'next';

export interface KitcoPoint {
  ts: number;   // unix timestamp
  price: number; // USD/oz
}

const GQL_QUERY = `query MetalMonthAnnual($symbol:String! $currency:String! $timestamp:Int!){
  GetHistoricalPointsV3(symbol:$symbol currency:$currency timestamp:$timestamp){
    thirtyDay{ID change changePercentage}
    sixtyDay{ID change changePercentage}
    oneYear{ID change changePercentage}
  }
}`;

async function fetchKitcoGql(timestamp: number) {
  const body = JSON.stringify({
    query: GQL_QUERY,
    variables: { symbol: 'AU', currency: 'USD', timestamp },
    operationName: 'MetalMonthAnnual',
  });

  const res = await fetch('https://kdb-gw.prod.kitco.com/', {
    method: 'POST',
    headers: {
      'Accept': 'application/graphql-response+json, application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5.1 Safari/605.1.15',
      'Referer': 'https://www.kitco.com/',
      'Origin': 'https://www.kitco.com',
      'x-query-id': JSON.stringify({
        query: 'MetalMonthAnnual($symbol:String!',
        variables: { symbol: 'AU', currency: 'USD', timestamp },
      }),
    },
    body,
    signal: AbortSignal.timeout(12000),
  });

  if (!res.ok) return null;
  return await res.json();
}

function toPoints(raw: Array<{ ID: string | number; change: number; changePercentage: number }>): KitcoPoint[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];

  const points: KitcoPoint[] = raw.map(p => ({
    ts: Number(p.ID),
    price: p.change,
  })).filter(p => p.ts > 0 && p.price > 100); // price > 100 = looks like USD/oz

  return points.sort((a, b) => a.ts - b.ts);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  const range = (req.query.range as string) ?? '30d';
  const timestamp = Math.floor(Date.now() / 1000);

  try {
    const json = await fetchKitcoGql(timestamp);
    const hist = json?.data?.GetHistoricalPointsV3;

    if (!hist) {
      return res.status(502).json({ error: 'Kitco returned no data', raw: json });
    }

    const thirtyd = toPoints(hist.thirtyDay  ?? []);
    const sixtyd  = toPoints(hist.sixtyDay   ?? []);
    const oneyr   = toPoints(hist.oneYear    ?? []);

    const points = range === '1y' ? oneyr : range === '60d' ? sixtyd : thirtyd;

    res.json({ points, range, count: points.length });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
