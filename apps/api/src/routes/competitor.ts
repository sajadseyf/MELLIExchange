import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { CompetitorRateModel } from '../models/CompetitorRate.js';
import { RateAlertModel } from '../models/RateAlert.js';
import { syncCompetitorRates } from '../competitorSync.js';
import { CurrencyModel } from '../models/Currency.js';

const router = Router();

// Latest rates from all sources + own rates for comparison
router.get('/latest', requireAuth, async (_req, res) => {
  const [vanex, arzsina, vbce, daniel, moneyway, mce, attar, own] = await Promise.all([
    CompetitorRateModel.findOne({ source: 'vanex'    }).sort({ recordedAt: -1 }).lean(),
    CompetitorRateModel.findOne({ source: 'arzsina'  }).sort({ recordedAt: -1 }).lean(),
    CompetitorRateModel.findOne({ source: 'vbce'     }).sort({ recordedAt: -1 }).lean(),
    CompetitorRateModel.findOne({ source: 'daniel'   }).sort({ recordedAt: -1 }).lean(),
    CompetitorRateModel.findOne({ source: 'moneyway' }).sort({ recordedAt: -1 }).lean(),
    CompetitorRateModel.findOne({ source: 'mce'      }).sort({ recordedAt: -1 }).lean(),
    CompetitorRateModel.findOne({ source: 'attar'    }).sort({ recordedAt: -1 }).lean(),
    CurrencyModel.find().lean(),
  ]);

  const toMap = (doc: any) => {
    const m: Record<string, { buy: number; sell: number }> = {};
    for (const r of doc?.rates ?? []) m[r.code] = { buy: r.buy, sell: r.sell };
    return { rates: m, recordedAt: doc?.recordedAt ?? null };
  };

  const ownMap: Record<string, { buy: number; sell: number; tier: 'high' | 'medium' | 'low'; locked: boolean }> = {};
  for (const c of own) ownMap[c.code] = { buy: c.buy, sell: c.sell, tier: ((c as any).tier ?? 'high') as 'high' | 'medium' | 'low', locked: (c as any).locked ?? false };

  res.json({
    own:      { rates: ownMap, recordedAt: own[0] ? (own[0] as any).updatedAt : null },
    vanex:    toMap(vanex),
    arzsina:  toMap(arzsina),
    vbce:     toMap(vbce),
    daniel:   toMap(daniel),
    moneyway: toMap(moneyway),
    mce:      toMap(mce),
    attar:    toMap(attar),
  });
});

// Save manual MoneyWay rate for a single currency
router.put('/moneyway/rate', requireAuth, async (req, res) => {
  const { code, buy, sell } = req.body as { code: string; buy: number; sell: number };
  if (!code || !isFinite(buy) || !isFinite(sell) || buy <= 0 || sell <= 0) {
    return res.status(400).json({ error: 'code, buy and sell are required positive numbers' });
  }

  // Load latest MoneyWay rates and apply this change on top
  const latest = await CompetitorRateModel.findOne({ source: 'moneyway' }).sort({ recordedAt: -1 }).lean() as any;
  const existingRates: Array<{ code: string; buy: number; sell: number }> = latest?.rates ?? [];
  const updatedRates = existingRates.filter((r: any) => r.code !== code);
  updatedRates.push({ code: code.toUpperCase(), buy, sell });

  await CompetitorRateModel.create({
    source: 'moneyway',
    recordedAt: new Date(),
    rates: updatedRates,
    manual: true,
  });

  res.json({ ok: true });
});

// Re-enable auto-sync for MoneyWay
router.post('/moneyway/auto', requireAuth, async (_req, res) => {
  // Trigger a fresh scrape which will create a non-manual document
  const { syncCompetitorRates } = await import('../competitorSync.js');
  // Temporarily patch: create a non-manual doc so next sync won't be blocked
  const latest = await CompetitorRateModel.findOne({ source: 'moneyway' }).sort({ recordedAt: -1 }).lean() as any;
  if (latest?.manual) {
    await CompetitorRateModel.create({
      source: 'moneyway',
      recordedAt: new Date(),
      rates: latest.rates ?? [],
      manual: false,
    });
  }
  syncCompetitorRates().catch(console.error);
  res.json({ ok: true, message: 'Auto-sync re-enabled, refresh started' });
});

// Manual refresh — awaited so Vercel doesn't terminate the function early
router.post('/refresh', requireAuth, async (_req, res) => {
  try {
    await syncCompetitorRates();
    res.json({ ok: true, message: 'Refresh complete' });
  } catch (e) {
    console.error('[refresh]', e);
    res.status(500).json({ error: 'Refresh failed' });
  }
});

// Alert history
router.get('/alerts', requireAuth, async (req, res) => {
  const limit = Number(req.query.limit ?? 100);
  const alerts = await RateAlertModel.find().sort({ createdAt: -1 }).limit(limit).lean();
  res.json(alerts);
});

export default router;
