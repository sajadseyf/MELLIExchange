import { Router } from 'express';
import { syncCompetitorRates } from '../competitorSync.js';
import { syncPrices, syncGoldSpot } from '../priceSync.js';

const router = Router();

function verifyCronSecret(req: import('express').Request, res: import('express').Response): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    res.status(500).json({ error: 'CRON_SECRET not configured' });
    return false;
  }
  if (req.headers.authorization !== `Bearer ${secret}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

router.get('/competitor', async (req, res) => {
  if (!verifyCronSecret(req, res)) return;
  try {
    await syncCompetitorRates();
    res.json({ ok: true });
  } catch (e: any) {
    console.error('[cron/competitor] failed:', e);
    res.status(500).json({ error: e.message });
  }
});

router.get('/prices', async (req, res) => {
  if (!verifyCronSecret(req, res)) return;
  try {
    await syncPrices();
    res.json({ ok: true });
  } catch (e: any) {
    console.error('[cron/prices] failed:', e);
    res.status(500).json({ error: e.message });
  }
});

router.get('/gold', async (req, res) => {
  if (!verifyCronSecret(req, res)) return;
  try {
    await syncGoldSpot();
    res.json({ ok: true });
  } catch (e: any) {
    console.error('[cron/gold] failed:', e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
