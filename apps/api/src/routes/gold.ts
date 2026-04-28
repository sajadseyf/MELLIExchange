import { Router } from 'express';
import { z } from 'zod';
import { GoldPriceModel } from '../models/GoldPrice.js';
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
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updated = await GoldPriceModel.findOneAndUpdate(
    { karat },
    { pricePerGram: parsed.data.pricePerGram },
    { new: true, upsert: true },
  );
  res.json(serialize(updated));
});

export default router;
