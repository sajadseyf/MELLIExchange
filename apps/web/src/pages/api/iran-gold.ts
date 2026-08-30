import type { NextApiRequest, NextApiResponse } from 'next';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export interface IranGoldData {
  geram18: string | null;   // 18K gold price in Toman
  mithqal: string | null;   // Gold Mithqal in Toman
  ons:     string | null;   // Gold Ounce in Toman
  tedpix:  string | null;   // Tehran Stock Exchange index
  updatedAt: string;
}

async function fetchSymbol(symbol: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.tgju.org/v1/market/indicator/summary-table-data/${symbol}`,
      { headers: { 'User-Agent': UA, 'Accept': 'application/json' }, signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return null;
    const json = await res.json();
    const p = json?.data?.p ?? json?.response?.p ?? json?.p ?? null;
    return typeof p === 'string' ? p : null;
  } catch { return null; }
}

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');

  const [geram18, mithqal, ons, tedpix] = await Promise.all([
    fetchSymbol('geram18'),
    fetchSymbol('mithqal'),
    fetchSymbol('ons'),
    fetchSymbol('tedpix'),
  ]);

  const data: IranGoldData = {
    geram18,
    mithqal,
    ons,
    tedpix,
    updatedAt: new Date().toISOString(),
  };

  res.json(data);
}
