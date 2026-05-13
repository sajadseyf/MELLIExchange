/**
 * Public REST API — v1
 * Designed for external consumption (Django, mobile apps, third-party sites).
 * No authentication required. CORS open.
 */

import { Router } from 'express';
import { CurrencyModel } from '../models/Currency.js';
import { GoldPriceModel } from '../models/GoldPrice.js';
import { SpotPriceModel } from '../models/SpotPrice.js';

const router = Router();

// Allow any origin for public API endpoints
router.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

/**
 * GET /api/v1/rates
 *
 * Returns all active currency buy/sell rates.
 *
 * Response:
 * {
 *   "updatedAt": "2024-05-12T10:30:00.000Z",
 *   "base": "CAD",
 *   "rates": [
 *     { "code": "USD", "name": "US Dollar", "symbol": "$", "buy": 1.3600, "sell": 1.3900 },
 *     { "code": "EUR", "name": "Euro",       "symbol": "€", "buy": 1.4800, "sell": 1.5200 },
 *     ...
 *   ]
 * }
 *
 * Optional query params:
 *   ?code=USD          → filter to a single currency
 *   ?codes=USD,EUR,GBP → filter to specific currencies
 */
router.get('/rates', async (req, res) => {
  try {
    const list = await CurrencyModel.find({ hidden: { $ne: true } })
      .sort({ order: 1, code: 1 })
      .lean();

    let currencies = list.map((c: any) => ({
      code:      c.code,
      name:      c.name,
      symbol:    c.symbol ?? '',
      buy:       c.buy  ?? 0,
      sell:      c.sell ?? 0,
      updatedAt: c.updatedAt?.toISOString?.() ?? null,
    }));

    // Filter by ?code=USD
    const codeParam = req.query.code ? String(req.query.code).toUpperCase() : null;
    if (codeParam) {
      currencies = currencies.filter((c) => c.code === codeParam);
    }

    // Filter by ?codes=USD,EUR,GBP
    const codesParam = req.query.codes ? String(req.query.codes).toUpperCase().split(',') : null;
    if (codesParam) {
      currencies = currencies.filter((c) => codesParam.includes(c.code));
    }

    const lastUpdated = currencies.reduce<string | null>((latest, c) => {
      if (!c.updatedAt) return latest;
      if (!latest || c.updatedAt > latest) return c.updatedAt;
      return latest;
    }, null);

    const caller = req.headers['x-forwarded-for'] ?? req.socket.remoteAddress ?? '?';
    console.log(`[v1/rates] ${new Date().toISOString()} | ip=${caller} | returned ${currencies.length} currencies`);
    currencies.forEach((c) =>
      console.log(`  ${c.code.padEnd(4)} buy=${c.buy.toFixed(4)}  sell=${c.sell.toFixed(4)}  updated=${c.updatedAt ?? '—'}`)
    );

    res.json({
      updatedAt: lastUpdated ?? new Date().toISOString(),
      base:      'CAD',
      rates:     currencies,
    });
  } catch (err) {
    console.error('[v1/rates]', err);
    res.status(500).json({ error: 'Failed to fetch rates' });
  }
});

/**
 * GET /api/v1/gold
 *
 * Returns gold price per gram for each karat in CAD.
 *
 * Response:
 * {
 *   "updatedAt": "2024-05-12T10:30:00.000Z",
 *   "currency": "CAD",
 *   "unit": "gram",
 *   "prices": {
 *     "k10": 45.20,
 *     "k14": 63.50,
 *     "k18": 81.60,
 *     "k22": 99.80,
 *     "k24": 108.90
 *   }
 * }
 */
router.get('/gold', async (_req, res) => {
  try {
    const list = await GoldPriceModel.find().lean();

    const prices: Record<string, number> = {};
    let lastUpdated: string | null = null;

    for (const g of list as any[]) {
      const key = `k${g.karat}`;
      prices[key] = g.pricePerGram ?? 0;
      const ts = g.updatedAt?.toISOString?.() ?? null;
      if (ts && (!lastUpdated || ts > lastUpdated)) lastUpdated = ts;
    }

    console.log(`[v1/gold] ${new Date().toISOString()} | prices: ${Object.entries(prices).map(([k, v]) => `${k}=${v}`).join('  ')}`);

    res.json({
      updatedAt: lastUpdated ?? new Date().toISOString(),
      currency:  'CAD',
      unit:      'gram',
      prices,
    });
  } catch (err) {
    console.error('[v1/gold]', err);
    res.status(500).json({ error: 'Failed to fetch gold prices' });
  }
});

/**
 * GET /api/v1/spot
 *
 * Returns live gold spot price (USD and CAD per troy oz).
 *
 * Response:
 * {
 *   "updatedAt": "2024-05-12T10:30:00.000Z",
 *   "gold": {
 *     "priceUsd": 3300.00,
 *     "priceCad": 4500.00,
 *     "bid":      3299.00,
 *     "ask":      3301.00,
 *     "change24h": 1.2
 *   }
 * }
 */
router.get('/spot', async (_req, res) => {
  try {
    const gold = await SpotPriceModel.findOne({ metal: 'gold' })
      .sort({ recordedAt: -1 })
      .lean() as any;

    if (!gold) {
      res.status(404).json({ error: 'No spot price available yet' });
      return;
    }

    res.json({
      updatedAt: gold.recordedAt?.toISOString?.() ?? new Date().toISOString(),
      gold: {
        priceUsd:  gold.priceUsd,
        priceCad:  gold.priceCad,
        bid:       gold.bid,
        ask:       gold.ask,
        change24h: gold.change24h ?? 0,
      },
    });
  } catch (err) {
    console.error('[v1/spot]', err);
    res.status(500).json({ error: 'Failed to fetch spot price' });
  }
});

/**
 * GET /api/v1/all
 *
 * Returns currencies + gold + spot in one call (convenient for dashboards).
 */
router.get('/all', async (req, res) => {
  try {
    const [currencies, goldList, spot] = await Promise.all([
      CurrencyModel.find({ hidden: { $ne: true } }).sort({ order: 1, code: 1 }).lean(),
      GoldPriceModel.find().lean(),
      SpotPriceModel.findOne({ metal: 'gold' }).sort({ recordedAt: -1 }).lean() as any,
    ]);

    const goldPrices: Record<string, number> = {};
    for (const g of goldList as any[]) {
      goldPrices[`k${g.karat}`] = g.pricePerGram ?? 0;
    }

    const caller = req.headers['x-forwarded-for'] ?? req.socket.remoteAddress ?? '?';
    const ts = new Date().toISOString();
    console.log(`[v1/all] ${ts} | ip=${caller}`);
    console.log(`  currencies (${(currencies as any[]).length}):`);
    (currencies as any[]).forEach((c) =>
      console.log(`    ${String(c.code).padEnd(4)} buy=${c.buy?.toFixed(4) ?? '—'}  sell=${c.sell?.toFixed(4) ?? '—'}`)
    );
    console.log(`  gold: ${Object.entries(goldPrices).map(([k, v]) => `${k}=${v}`).join('  ')}`);
    console.log(`  spot: USD=${spot?.priceUsd ?? '—'}  CAD=${spot?.priceCad ?? '—'}`);

    res.json({
      generatedAt: ts,
      currencies: (currencies as any[]).map((c) => ({
        code:   c.code,
        name:   c.name,
        symbol: c.symbol ?? '',
        buy:    c.buy  ?? 0,
        sell:   c.sell ?? 0,
      })),
      gold: {
        currency: 'CAD',
        unit:     'gram',
        prices:   goldPrices,
      },
      spot: spot ? {
        priceUsd:  spot.priceUsd,
        priceCad:  spot.priceCad,
        bid:       spot.bid,
        ask:       spot.ask,
        change24h: spot.change24h ?? 0,
      } : null,
    });
  } catch (err) {
    console.error('[v1/all]', err);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

export default router;
