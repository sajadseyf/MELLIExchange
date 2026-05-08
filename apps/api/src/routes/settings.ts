import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { SettingsModel } from '../models/Settings.js';
import { syncPrices, previewRates } from '../priceSync.js';

const router = Router();

router.get('/', requireAuth, async (_req, res) => {
  const doc = await SettingsModel.findOne().lean() ?? await SettingsModel.create({});
  const keys   = (doc as any).apiKeys ?? {};
  const alerts = (doc as any).alerts  ?? {};
  res.json({
    currencySource: (doc as any).currencySource ?? 'vanex_scrape',
    goldSource:     (doc as any).goldSource     ?? 'yahoo_finance',
    spread:         (doc as any).spread         ?? 1.5,
    hasApiKeys: {
      open_exchange_rates: !!keys.open_exchange_rates,
      currency_api:        !!keys.currency_api,
      metals_api:          !!keys.metals_api,
      gold_api:            !!keys.gold_api,
    },
    alerts: {
      enabled:      alerts.enabled      ?? false,
      email:        alerts.email        ?? '',
      phone:        alerts.phone        ?? '',
      thresholdPct: alerts.thresholdPct ?? 0.5,
      smtpHost:     alerts.smtpHost     ?? '',
      smtpPort:     alerts.smtpPort     ?? 587,
      smtpUser:     alerts.smtpUser     ?? '',
      smtpPass:     '',  // never expose password in GET
      twilioSid:    alerts.twilioSid    ?? '',
      twilioToken:  '',  // never expose token in GET
      twilioFrom:   alerts.twilioFrom   ?? '',
    },
  });
});

router.put('/', requireAuth, async (req, res) => {
  const { currencySource, goldSource, spread, apiKeys } = req.body as {
    currencySource?: string;
    goldSource?: string;
    spread?: number;
    apiKeys?: Record<string, string>;
  };

  const update: Record<string, unknown> = {};
  if (currencySource)          update['currencySource'] = currencySource;
  if (goldSource)              update['goldSource']     = goldSource;
  if (typeof spread === 'number') update['spread']      = spread;
  if (apiKeys) {
    for (const [k, v] of Object.entries(apiKeys)) {
      if (v) update[`apiKeys.${k}`] = v;
    }
  }

  await SettingsModel.findOneAndUpdate({}, { $set: update }, { upsert: true, new: true });
  res.json({ ok: true });
});

// PATCH — partial update (used by alerts config)
router.patch('/', requireAuth, async (req, res) => {
  const { alerts } = req.body as { alerts?: Record<string, unknown> };
  const update: Record<string, unknown> = {};
  if (alerts) {
    for (const [k, v] of Object.entries(alerts)) {
      // Only save non-empty secrets (empty string = don't overwrite)
      if ((k === 'smtpPass' || k === 'twilioToken') && v === '') continue;
      update[`alerts.${k}`] = v;
    }
  }
  await SettingsModel.findOneAndUpdate({}, { $set: update }, { upsert: true, new: true });
  res.json({ ok: true });
});

// Trigger an immediate price sync — responds instantly, runs sync in background
router.post('/sync', requireAuth, (_req, res) => {
  res.json({ ok: true, message: 'Sync started' });
  syncPrices().catch(console.error);
});

// Fetch current rates from all sources for comparison (admin use)
router.get('/preview', requireAuth, async (_req, res) => {
  const data = await previewRates();
  res.json(data);
});

export default router;
