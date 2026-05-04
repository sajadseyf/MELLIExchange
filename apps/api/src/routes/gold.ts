import { Router } from 'express';
import { z } from 'zod';
import { GoldPriceModel } from '../models/GoldPrice.js';
import { GoldPriceHistoryModel } from '../models/GoldPriceHistory.js';
import { requireAuth } from '../auth.js';

const router = Router();

function serialize(doc: any) {
  return {
    karat: doc.karat,
    pricePerGram: doc.pricePerGram,
    updatedAt: doc.updatedAt?.toISOString?.() ?? new Date().toISOString(),
  };
}

router.get('/', async (_req, res) => {
  const list = await GoldPriceModel.find().sort({ karat: 1 }).lean();
  res.json(list.map(serialize));
});

// GET /api/gold/history?days=30
router.get('/history', async (req, res) => {
  const days = Math.min(Number(req.query.days) || 30, 90);
  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await GoldPriceHistoryModel
    .find({ recordedAt: { $gte: since } })
    .sort({ recordedAt: 1 })
    .lean();

  // Pivot to { date, k18, k22, k24 } per day
  const dayMap = new Map<string, { date: string; k18?: number; k22?: number; k24?: number }>();
  for (const r of rows) {
    const date = (r.recordedAt as Date).toISOString().slice(0, 10);
    if (!dayMap.has(date)) dayMap.set(date, { date });
    const entry = dayMap.get(date)!;
    if (r.karat === 18) entry.k18 = r.pricePerGram;
    if (r.karat === 22) entry.k22 = r.pricePerGram;
    if (r.karat === 24) entry.k24 = r.pricePerGram;
  }

  res.json(Array.from(dayMap.values()));
});

const updateSchema = z.object({
  pricePerGram: z.number().nonnegative(),
});

router.put('/:karat', requireAuth, async (req, res) => {
  const karat = Number(req.params.karat);
  if (![18, 22, 24].includes(karat)) {
    res.status(400).json({ error: 'Invalid karat' });
    return;
  }
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
    res.status(400).json({ error: msg });
    return;
  }
  const updated = await GoldPriceModel.findOneAndUpdate(
    { karat },
    { pricePerGram: parsed.data.pricePerGram },
    { new: true, upsert: true },
  );

  // Record history snapshot
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  await GoldPriceHistoryModel.updateOne(
    { karat, recordedAt: today },
    { $set: { pricePerGram: parsed.data.pricePerGram } },
    { upsert: true },
  );

  res.json(serialize(updated));
});

export default router;
