import { Router } from 'express';
import { SpotPriceModel } from '../models/SpotPrice.js';
import { syncPrices } from '../priceSync.js';

const router = Router();

// Latest spot prices for gold and silver
router.get('/latest', async (_req, res) => {
  const [gold, silver] = await Promise.all([
    SpotPriceModel.findOne({ metal: 'gold'   }).sort({ recordedAt: -1 }).lean(),
    SpotPriceModel.findOne({ metal: 'silver' }).sort({ recordedAt: -1 }).lean(),
  ]);
  res.json({ gold, silver });
});

// History for charts
router.get('/history', async (req, res) => {
  const metal = req.query.metal as string ?? 'gold';
  const days  = Number(req.query.days ?? 30);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const data  = await SpotPriceModel.find({ metal, recordedAt: { $gte: since } })
    .sort({ recordedAt: 1 })
    .lean();
  res.json(data.map((d: any) => ({
    date:      d.recordedAt,
    priceUsd:  d.priceUsd,
    priceCad:  d.priceCad,
    change24h: d.change24h,
  })));
});

// Trigger an immediate price sync (fires in background, returns immediately)
router.post('/sync', (_req, res) => {
  syncPrices().catch(console.error);
  res.json({ ok: true, message: 'Sync started' });
});

export default router;
