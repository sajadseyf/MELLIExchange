/**
 * Backfill 30 days of real price history into MongoDB.
 *
 * Gold   — Yahoo Finance GC=F (daily OHLC)
 * Forex  — VanEx Group history API (15-min intervals, grouped to daily)
 *
 * Run: pnpm --filter @melli/api backfill
 */

import { connectDb } from './db.js';
import { GoldPriceHistoryModel } from './models/GoldPriceHistory.js';
import { CurrencyPriceHistoryModel } from './models/CurrencyPriceHistory.js';
import { CurrencyIntradayModel } from './models/CurrencyIntraday.js';
import { CurrencyModel } from './models/Currency.js';

const TROY_OZ_GRAMS = 31.1035;
const DAYS = 30;
const VANEX_RATE_ID = 10;    // main retail rate at VanEx
const VANEX_PERIOD  = 720;   // hours = 30 days

// ── VanEx history ─────────────────────────────────────────────────────────────

interface VanExPoint {
  buy: number;
  sell: number;
  middle: number;
  dataUpdate: string; // ISO 8601
}

async function fetchVanExIntraday(isoId: string): Promise<Array<{ recordedAt: Date; buy: number; sell: number }>> {
  try {
    const url = `https://vanexgroup.com/api/currency/history?rateId=${VANEX_RATE_ID}&isoId=${isoId}&periodTime=${VANEX_PERIOD}`;
    const res = await fetch(url, {
      headers: {
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5.1 Safari/605.1.15',
        'Referer': 'https://vanexgroup.com/en/liveRate',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Dest': 'empty',
      },
    });
    if (!res.ok) throw new Error(`VanEx intraday ${res.status} for ${isoId}`);
    const points = (await res.json()) as VanExPoint[];
    return points
      .filter((p) => p.buy > 0 && p.sell > 0)
      .map((p) => ({
        recordedAt: new Date(p.dataUpdate),
        buy:  Math.round(p.buy  * 1e6) / 1e6,
        sell: Math.round(p.sell * 1e6) / 1e6,
      }));
  } catch (err) {
    console.warn(`[backfill] VanEx intraday failed for ${isoId}:`, err);
    return [];
  }
}

async function fetchVanExHistory(isoId: string): Promise<Map<string, { buy: number; sell: number }>> {
  const map = new Map<string, { buy: number; sell: number }>();
  try {
    const url = `https://vanexgroup.com/api/currency/history?rateId=${VANEX_RATE_ID}&isoId=${isoId}&periodTime=${VANEX_PERIOD}`;
    const res = await fetch(url, {
      headers: {
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5.1 Safari/605.1.15',
        'Referer': 'https://vanexgroup.com/en/liveRate',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Dest': 'empty',
      },
    });
    if (!res.ok) throw new Error(`VanEx history ${res.status} for ${isoId}`);
    const points = (await res.json()) as VanExPoint[];

    // Group by date — keep last record of each day (most recent close)
    const byDate = new Map<string, VanExPoint>();
    for (const p of points) {
      const date = p.dataUpdate.slice(0, 10); // YYYY-MM-DD
      // Points are newest-first; first hit wins (= most recent close for that day)
      if (!byDate.has(date)) byDate.set(date, p);
    }

    for (const [date, p] of byDate) {
      if (p.buy > 0 && p.sell > 0) {
        map.set(date, {
          buy:  Math.round(p.buy  * 1e6) / 1e6,
          sell: Math.round(p.sell * 1e6) / 1e6,
        });
      }
    }
  } catch (err) {
    console.warn(`[backfill] VanEx history failed for ${isoId}:`, err);
  }
  return map;
}

// ── Gold history (Yahoo Finance) ──────────────────────────────────────────────

async function fetchGoldHistory(): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  try {
    const res = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&range=35d',
      { headers: { 'User-Agent': 'Mozilla/5.0' } },
    );
    if (!res.ok) throw new Error(`Yahoo ${res.status}`);
    const data = (await res.json()) as {
      chart: {
        result: Array<{
          timestamp: number[];
          indicators: { quote: Array<{ close: number[] }> };
        }>;
      };
    };
    const result = data?.chart?.result?.[0];
    if (!result) throw new Error('No result');

    const timestamps = result.timestamp;
    const closes = result.indicators.quote[0]?.close ?? [];
    for (let i = 0; i < timestamps.length; i++) {
      const close = closes[i];
      if (!close || close <= 0) continue;
      const date = new Date(timestamps[i]! * 1000).toISOString().slice(0, 10);
      map.set(date, close);
    }
    console.log(`[backfill] gold: ${map.size} days from Yahoo Finance`);
  } catch (err) {
    console.error('[backfill] gold fetch failed:', err);
  }
  return map;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function backfill() {
  await connectDb();

  const tracked = await CurrencyModel.find().lean();
  const cutoff  = new Date();
  cutoff.setDate(cutoff.getDate() - DAYS);

  // ── Fetch VanEx history for each tracked currency (in parallel batches) ──
  console.log(`[backfill] fetching VanEx history for ${tracked.length} currencies…`);
  const historyMap = new Map<string, Map<string, { buy: number; sell: number }>>();

  // Fetch 5 at a time to avoid overwhelming the API
  const BATCH = 5;
  for (let i = 0; i < tracked.length; i += BATCH) {
    const batch = tracked.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map((c) => fetchVanExHistory(c.code).then((m) => [c.code, m] as const)),
    );
    for (const [code, m] of results) {
      if (m.size > 0) {
        historyMap.set(code, m);
        console.log(`  ${code}: ${m.size} days`);
      } else {
        console.log(`  ${code}: no VanEx data`);
      }
    }
  }

  // ── Fetch USD/CAD history from VanEx (needed for gold calc) ───────────────
  const usdHistory = historyMap.get('USD') ?? new Map<string, { buy: number; sell: number }>();

  // ── Gold history ──────────────────────────────────────────────────────────
  const goldHistory = await fetchGoldHistory();
  const karats: Array<{ karat: 14 | 18 | 22 | 24; fraction: number }> = [
    { karat: 14, fraction: 14 / 24 },
    { karat: 18, fraction: 18 / 24 },
    { karat: 22, fraction: 22 / 24 },
    { karat: 24, fraction: 24 / 24 },
  ];

  let goldCount = 0;
  for (const [dateStr, goldUSD] of goldHistory) {
    if (new Date(dateStr) < cutoff) continue;
    const usdRate = usdHistory.get(dateStr);
    const usdCad  = usdRate ? (usdRate.buy + usdRate.sell) / 2 : 1.37;
    const goldCADperGram = (goldUSD * usdCad) / TROY_OZ_GRAMS;
    const recordedAt = new Date(dateStr + 'T00:00:00Z');

    for (const { karat, fraction } of karats) {
      const price = Math.round(goldCADperGram * fraction * 100) / 100;
      await GoldPriceHistoryModel.updateOne(
        { karat, recordedAt },
        { $set: { pricePerGram: price, karat, recordedAt } },
        { upsert: true },
      );
      goldCount++;
    }
  }
  console.log(`[backfill] gold: ${goldCount} records written`);

  // ── Currency history ──────────────────────────────────────────────────────
  let currencyCount = 0;
  for (const cur of tracked) {
    const dayMap = historyMap.get(cur.code);
    if (!dayMap || dayMap.size === 0) continue;

    for (const [dateStr, rate] of dayMap) {
      if (new Date(dateStr) < cutoff) continue;
      const recordedAt = new Date(dateStr + 'T00:00:00Z');
      await CurrencyPriceHistoryModel.updateOne(
        { code: cur.code, recordedAt },
        { $set: { buy: rate.buy, sell: rate.sell, code: cur.code, recordedAt } },
        { upsert: true },
      );
      currencyCount++;
    }
  }
  console.log(`[backfill] currencies: ${currencyCount} records written`);

  // ── Intraday (15-min) history ─────────────────────────────────────────────
  console.log(`[backfill] fetching VanEx intraday (720h) for ${tracked.length} currencies…`);
  let intradayCount = 0;

  for (let i = 0; i < tracked.length; i += BATCH) {
    const batch = tracked.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map((c) => fetchVanExIntraday(c.code).then((pts) => [c.code, pts] as const)),
    );
    for (const [code, pts] of results) {
      if (!pts.length) { console.log(`  ${code}: no intraday data`); continue; }
      for (const pt of pts) {
        await CurrencyIntradayModel.updateOne(
          { code, recordedAt: pt.recordedAt },
          { $set: { buy: pt.buy, sell: pt.sell, code, recordedAt: pt.recordedAt } },
          { upsert: true },
        );
        intradayCount++;
      }
      console.log(`  ${code}: ${pts.length} intraday points`);
    }
  }
  console.log(`[backfill] intraday: ${intradayCount} records written`);

  console.log('[backfill] done');
  process.exit(0);
}

backfill().catch((err) => {
  console.error('[backfill] fatal:', err);
  process.exit(1);
});
