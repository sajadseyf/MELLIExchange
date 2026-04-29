import { Router } from 'express';
import { z } from 'zod';
import { CurrencyModel } from '../models/Currency.js';
import { requireAuth } from '../auth.js';

const router = Router();

function serialize(doc: any) {
  return {
    code: doc.code,
    name: doc.name,
    symbol: doc.symbol,
    flag: doc.flag ?? '',
    buy: doc.buy,
    sell: doc.sell,
    order: doc.order ?? 0,
    updatedAt: doc.updatedAt?.toISOString?.() ?? new Date().toISOString(),
  };
}

router.get('/', async (_req, res) => {
  const list = await CurrencyModel.find().sort({ order: 1, code: 1 }).lean();
  res.json(list.map(serialize));
});

const upsertSchema = z.object({
  code: z.string().min(2).max(8).transform((s) => s.toUpperCase()),
  name: z.string().min(1),
  symbol: z.string().min(1),
  flag: z.string().optional().default(''),
  buy: z.number().nonnegative(),
  sell: z.number().nonnegative(),
  order: z.number().int().optional().default(0),
});

function formatZodError(err: z.ZodError): string {
  return err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
}

router.post('/', requireAuth, async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: formatZodError(parsed.error) });
    return;
  }
  const exists = await CurrencyModel.findOne({ code: parsed.data.code });
  if (exists) {
    res.status(409).json({ error: 'Currency already exists' });
    return;
  }
  const created = await CurrencyModel.create(parsed.data);
  res.status(201).json(serialize(created));
});

const updateSchema = upsertSchema.partial().omit({ code: true });

router.put('/:code', requireAuth, async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: formatZodError(parsed.error) });
    return;
  }
  const code = (req.params.code ?? '').toUpperCase();
  const updated = await CurrencyModel.findOneAndUpdate({ code }, parsed.data, { new: true });
  if (!updated) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(serialize(updated));
});

router.delete('/:code', requireAuth, async (req, res) => {
  const code = (req.params.code ?? '').toUpperCase();
  const result = await CurrencyModel.deleteOne({ code });
  if (result.deletedCount === 0) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json({ ok: true });
});

export default router;
