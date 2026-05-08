import { Router } from 'express';
import { z } from 'zod';
import { CurrencyModel } from '../models/Currency.js';
import { CurrencyPriceHistoryModel } from '../models/CurrencyPriceHistory.js';
import { CurrencyIntradayModel } from '../models/CurrencyIntraday.js';
import { requireAuth } from '../auth.js';

const VANEX_HEADERS = {
  'Accept': '*/*',
  'Accept-Language': 'en-US,en;q=0.9',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5.1 Safari/605.1.15',
  'Referer': 'https://vanexgroup.com/en/liveRate',
  'Sec-Fetch-Site': 'same-origin',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Dest': 'empty',
};

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
    contactUs: doc.contactUs ?? false,
    hidden: doc.hidden ?? false,
    updatedAt: doc.updatedAt?.toISOString?.() ?? new Date().toISOString(),
  };
}

router.get('/', async (_req, res) => {
  const list = await CurrencyModel.find().sort({ order: 1, code: 1 }).lean();
  res.json(list.map(serialize));
});

// GET /api/currencies/live?code=USD&hours=24
// Proxies VanEx history API — returns intraday buy/sell points (every ~15 min)
router.get('/live', async (req, res) => {
  const code  = String(req.query.code  ?? '').toUpperCase();
  // 24 = last 24h, 168 = last 7d, 720 = last 30d
  const hours = Math.min(Math.max(Number(req.query.hours ?? 24), 1), 720);
  if (!code) { res.status(400).json({ error: 'code is required' }); return; }

  try {
    const url = `https://vanexgroup.com/api/currency/history?rateId=10&isoId=${code}&periodTime=${hours}`;
    const upstream = await fetch(url, { headers: VANEX_HEADERS });
    if (!upstream.ok) throw new Error(`VanEx ${upstream.status}`);
    const points = (await upstream.json()) as Array<{
      buy: number; sell: number; dataUpdate: string;
    }>;

    // VanEx returns newest-first — reverse to chronological
    res.json(
      points.reverse().map((p) => ({
        time: p.dataUpdate,
        buy:  Math.round(p.buy  * 1e6) / 1e6,
        sell: Math.round(p.sell * 1e6) / 1e6,
      })),
    );
  } catch (vanexErr) {
    console.warn('[currencies/live] VanEx failed — falling back to MongoDB:', vanexErr);
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);
      const records = await CurrencyIntradayModel.find({
        code,
        recordedAt: { $gte: since },
      }).sort({ recordedAt: 1 }).lean();

      res.json(records.map((r) => ({
        time: (r.recordedAt as Date).toISOString(),
        buy:  r.buy,
        sell: r.sell,
      })));
    } catch (fallbackErr) {
      console.error('[currencies/live] MongoDB fallback failed:', fallbackErr);
      res.status(502).json({ error: 'Failed to fetch live rates' });
    }
  }
});

// GET /api/currencies/history?code=USD&days=30
router.get('/history', async (req, res) => {
  const code = String(req.query.code ?? '').toUpperCase();
  const days = Math.min(Math.max(Number(req.query.days ?? 30), 1), 90);

  if (!code) {
    res.status(400).json({ error: 'code is required' });
    return;
  }

  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const records = await CurrencyPriceHistoryModel.find({
    code,
    recordedAt: { $gte: since },
  }).sort({ recordedAt: 1 }).lean();

  res.json(
    records.map((r) => ({
      date: (r.recordedAt as Date).toISOString().slice(0, 10),
      buy: r.buy,
      sell: r.sell,
    })),
  );
});

const upsertSchema = z.object({
  code:   z.string().min(2).max(8).transform((s) => s.toUpperCase()),
  name:   z.string().min(1),
  symbol: z.string().min(1),
  flag:   z.string().optional().default(''),
  buy:    z.number().nonnegative(),
  sell:   z.number().nonnegative(),
  order:  z.number().int().optional().default(0),
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

const updateSchema = upsertSchema.partial().omit({ code: true }).extend({
  contactUs: z.boolean().optional(),
  hidden: z.boolean().optional(),
});

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

  // Record history snapshot for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  await CurrencyPriceHistoryModel.updateOne(
    { code, recordedAt: today },
    { $set: { buy: updated.buy, sell: updated.sell, recordedAt: today, code } },
    { upsert: true },
  );

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
