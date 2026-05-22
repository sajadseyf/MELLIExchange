import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { CompetitorRateModel } from '../models/CompetitorRate.js';
import { RateAlertModel } from '../models/RateAlert.js';
import { syncCompetitorRates } from '../competitorSync.js';
import { CurrencyModel } from '../models/Currency.js';

const router = Router();

// Latest rates from all sources + own rates for comparison
router.get('/latest', requireAuth, async (_req, res) => {
  const [vanex, arzsina, vbce, daniel, moneyway, own] = await Promise.all([
    CompetitorRateModel.findOne({ source: 'vanex'    }).sort({ recordedAt: -1 }).lean(),
    CompetitorRateModel.findOne({ source: 'arzsina'  }).sort({ recordedAt: -1 }).lean(),
    CompetitorRateModel.findOne({ source: 'vbce'     }).sort({ recordedAt: -1 }).lean(),
    CompetitorRateModel.findOne({ source: 'daniel'   }).sort({ recordedAt: -1 }).lean(),
    CompetitorRateModel.findOne({ source: 'moneyway' }).sort({ recordedAt: -1 }).lean(),
    CurrencyModel.find().lean(),
  ]);

  const toMap = (doc: any) => {
    const m: Record<string, { buy: number; sell: number }> = {};
    for (const r of doc?.rates ?? []) m[r.code] = { buy: r.buy, sell: r.sell };
    return { rates: m, recordedAt: doc?.recordedAt ?? null };
  };

  const ownMap: Record<string, { buy: number; sell: number }> = {};
  for (const c of own) ownMap[c.code] = { buy: c.buy, sell: c.sell };

  res.json({
    own:      { rates: ownMap, recordedAt: own[0] ? (own[0] as any).updatedAt : null },
    vanex:    toMap(vanex),
    arzsina:  toMap(arzsina),
    vbce:     toMap(vbce),
    daniel:   toMap(daniel),
    moneyway: toMap(moneyway),
  });
});

// Manual refresh
router.post('/refresh', requireAuth, async (_req, res) => {
  syncCompetitorRates().catch(console.error);
  res.json({ ok: true, message: 'Refresh started in background' });
});

// Alert history
router.get('/alerts', requireAuth, async (req, res) => {
  const limit = Number(req.query.limit ?? 100);
  const alerts = await RateAlertModel.find().sort({ createdAt: -1 }).limit(limit).lean();
  res.json(alerts);
});

export default router;
