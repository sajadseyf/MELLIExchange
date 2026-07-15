import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchKitcoSpot } from '@/lib/gold-spot';

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');

  const spot = await fetchKitcoSpot();
  if (!spot) {
    res.status(503).json({ error: 'Gold price unavailable' });
    return;
  }
  res.json(spot);
}
