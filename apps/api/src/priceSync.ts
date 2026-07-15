import cron from 'node-cron';
import { GoldPriceModel } from './models/GoldPrice.js';
import { GoldPriceHistoryModel } from './models/GoldPriceHistory.js';
import { CurrencyModel } from './models/Currency.js';
import { CurrencyPriceHistoryModel } from './models/CurrencyPriceHistory.js';
import { CurrencyIntradayModel } from './models/CurrencyIntraday.js';
import { SettingsModel } from './models/Settings.js';
import { SpotPriceModel } from './models/SpotPrice.js';
import { CompetitorRateModel } from './models/CompetitorRate.js';
import { syncCompetitorRates } from './competitorSync.js';
import { generateMarketAnalysis } from './analysisGenerator.js';

const TROY_OZ_GRAMS = 31.1035;

const VANEX_HEADERS = {
  'Accept': '*/*',
  'Accept-Language': 'en-US,en;q=0.9',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5.1 Safari/605.1.15',
  'Referer': 'https://vanexgroup.com/en/liveRate',
  'Sec-Fetch-Site': 'same-origin',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Dest': 'empty',
};

type CurrencyRates = Map<string, { buy: number; sell: number }>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function applySpread(mid: number, pct: number) {
  const s = pct / 100;
  return {
    buy:  Math.round(mid * (1 - s) * 1e6) / 1e6,
    sell: Math.round(mid * (1 + s) * 1e6) / 1e6,
  };
}

// AED and SAR are USD-pegged — Frankfurter / BoC don't always include them
const USD_PEGS: Record<string, number> = { AED: 3.6725, SAR: 3.75 };

// Convert a map of { code: rateVsUSD } (1 USD = X code) → CurrencyRates in CAD
function buildFromUSD(ratesVsUSD: Record<string, number>, spreadPct: number): CurrencyRates {
  const map: CurrencyRates = new Map();
  const usdCad = ratesVsUSD['CAD'] ?? 1.37;
  for (const [code, rate] of Object.entries(ratesVsUSD)) {
    if (code === 'CAD') continue;
    if (!rate || rate <= 0) continue;
    map.set(code, applySpread(usdCad / rate, spreadPct));
  }
  map.set('USD', applySpread(usdCad, spreadPct));
  for (const [code, peg] of Object.entries(USD_PEGS)) {
    if (!map.has(code)) map.set(code, applySpread(usdCad / peg, spreadPct));
  }
  return map;
}

// ── Currency source fetchers ──────────────────────────────────────────────────

async function fromVanEx(_spreadPct: number): Promise<CurrencyRates | null> {
  try {
    // Use the same history API that powers the chart — avoids bot detection on the HTML page.
    // periodTime=1 fetches only the last hour (a handful of 15-min points); we take [0] (newest-first).
    const tracked = await CurrencyModel.find({ code: { $ne: 'IRR' } }).lean();
    const codes = tracked.map((c) => c.code);
    const map: CurrencyRates = new Map();
    const BATCH = 8;

    for (let i = 0; i < codes.length; i += BATCH) {
      await Promise.all(
        codes.slice(i, i + BATCH).map(async (code) => {
          try {
            const url = `https://vanexgroup.com/api/currency/history?rateId=10&isoId=${code}&periodTime=1`;
            const res = await fetch(url, { headers: VANEX_HEADERS });
            if (!res.ok) { console.warn(`[priceSync] VanEx ${code}: ${res.status}`); return; }
            const pts = (await res.json()) as Array<{ buy: number; sell: number }>;
            const latest = pts[0];
            if (latest && latest.buy > 0 && latest.sell > 0) {
              map.set(code, {
                buy:  Math.round(latest.buy  * 1e6) / 1e6,
                sell: Math.round(latest.sell * 1e6) / 1e6,
              });
            }
          } catch (e) {
            console.warn(`[priceSync] VanEx ${code} error:`, e);
          }
        }),
      );
    }

    console.log(`[priceSync] VanEx API: ${map.size}/${codes.length} rates`);
    return map.size > 0 ? map : null;
  } catch (err) {
    console.error('[priceSync] VanEx failed:', err);
    return null;
  }
}

async function fromVBCE(_spreadPct: number): Promise<CurrencyRates | null> {
  try {
    const res = await fetch(
      'https://rs1.smallfactory.dev/api/v1/rates?apikey=bc9959c3faab76071c6fb348c509f7f32',
      { headers: { 'Accept': 'application/json', 'Origin': 'https://www.vbce.ca', 'Referer': 'https://www.vbce.ca/' } },
    );
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[priceSync] VBCE API ${res.status}:`, body.slice(0, 200));
      return null;
    }
    const raw = await res.json();

    // Response may be an array or wrapped object — handle both
    const list: Array<Record<string, string>> = Array.isArray(raw) ? raw : (raw as any)?.data ?? [];
    if (!list.length) {
      console.warn('[priceSync] VBCE: empty response:', JSON.stringify(raw).slice(0, 300));
      return null;
    }

    // Field names may vary (iso/iso_code, buy_price/buyPrice, sell_price/sellPrice)
    const map: CurrencyRates = new Map();
    for (const r of list) {
      const code = r['iso'] ?? r['iso_code'] ?? r['currency'] ?? '';
      const buy  = parseFloat(r['buy_price'] ?? r['buyPrice'] ?? r['buy'] ?? '0');
      const sell = parseFloat(r['sell_price'] ?? r['sellPrice'] ?? r['sell'] ?? '0');
      if (code && buy > 0 && sell > 0) map.set(code.toUpperCase(), { buy, sell });
    }
    console.log(`[priceSync] VBCE: ${map.size} rates`);
    return map.size > 0 ? map : null;
  } catch (err) {
    console.error('[priceSync] VBCE failed:', err);
    return null;
  }
}

async function fromArzSina(_spreadPct: number): Promise<CurrencyRates | null> {
  try {
    const res = await fetch('https://arzsina.com/cash-exchange-rates/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });
    if (!res.ok) throw new Error(`ArzSina ${res.status}`);
    const html = await res.text();

    // Rates are in a plain HTML table: <td>USD</td><td class="d-none...">Dollars</td><td>1.3419</td><td>1.376</td>
    const rows = [...html.matchAll(/<td>\s*([A-Z]{2,4})\s*<\/td>\s*<td[^>]*>[^<]*<\/td>\s*<td>([\d.]+)<\/td>\s*<td>([\d.]+)<\/td>/g)];

    const map: CurrencyRates = new Map();
    for (const [, code, buyStr, sellStr] of rows) {
      const buy  = parseFloat(buyStr ?? '0');
      const sell = parseFloat(sellStr ?? '0');
      if (code && buy > 0 && sell > 0) map.set(code, { buy, sell });
    }
    console.log(`[priceSync] ArzSina: ${map.size} rates`);
    return map;
  } catch (err) {
    console.error('[priceSync] ArzSina failed:', err);
    return null;
  }
}

async function fromBankOfCanada(spreadPct: number): Promise<CurrencyRates | null> {
  try {
    const res = await fetch(
      'https://www.bankofcanada.ca/valet/observations/group/FX_RATES_DAILY/json?recent=1',
      { headers: { 'Accept': 'application/json' } },
    );
    if (!res.ok) throw new Error(`Bank of Canada ${res.status}`);
    const data = (await res.json()) as {
      observations: Array<Record<string, { v: string } | string>>;
    };
    const obs = data.observations?.[0];
    if (!obs) throw new Error('No observations');

    const map: CurrencyRates = new Map();
    for (const [key, val] of Object.entries(obs)) {
      if (!key.startsWith('FX') || !key.endsWith('CAD')) continue;
      const code = key.slice(2, -3);
      const rate = typeof val === 'object' ? parseFloat((val as { v: string }).v) : NaN;
      if (!code || isNaN(rate) || rate <= 0) continue;
      map.set(code, applySpread(rate, spreadPct));
    }
    // Add USD-pegged currencies using the USD/CAD rate
    const usdRate = map.get('USD');
    const usdCad = usdRate ? (usdRate.buy + usdRate.sell) / 2 : 1.37;
    for (const [code, peg] of Object.entries(USD_PEGS)) {
      if (!map.has(code)) map.set(code, applySpread(usdCad / peg, spreadPct));
    }
    console.log(`[priceSync] Bank of Canada: ${map.size} rates`);
    return map;
  } catch (err) {
    console.error('[priceSync] Bank of Canada failed:', err);
    return null;
  }
}

async function fromFrankfurter(spreadPct: number): Promise<CurrencyRates | null> {
  try {
    const res = await fetch('https://api.frankfurter.app/latest?from=USD', {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error(`Frankfurter ${res.status}`);
    const data = (await res.json()) as { rates: Record<string, number> };
    const map = buildFromUSD({ USD: 1, ...data.rates }, spreadPct);
    console.log(`[priceSync] Frankfurter: ${map.size} rates`);
    return map;
  } catch (err) {
    console.error('[priceSync] Frankfurter failed:', err);
    return null;
  }
}

async function fromOpenER(spreadPct: number): Promise<CurrencyRates | null> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!res.ok) throw new Error(`open.er-api ${res.status}`);
    const data = (await res.json()) as { result: string; rates: Record<string, number> };
    if (data.result !== 'success') throw new Error('non-success result');
    const map = buildFromUSD(data.rates, spreadPct);
    console.log(`[priceSync] open.er-api: ${map.size} rates`);
    return map;
  } catch (err) {
    console.error('[priceSync] open.er-api failed:', err);
    return null;
  }
}

async function fromOpenExchangeRates(apiKey: string, spreadPct: number): Promise<CurrencyRates | null> {
  if (!apiKey) { console.warn('[priceSync] Open Exchange Rates: no API key'); return null; }
  try {
    const res = await fetch(`https://openexchangerates.org/api/latest.json?app_id=${apiKey}&base=USD`);
    if (!res.ok) throw new Error(`Open Exchange Rates ${res.status}`);
    const data = (await res.json()) as { rates: Record<string, number> };
    const map = buildFromUSD(data.rates, spreadPct);
    console.log(`[priceSync] Open Exchange Rates: ${map.size} rates`);
    return map;
  } catch (err) {
    console.error('[priceSync] Open Exchange Rates failed:', err);
    return null;
  }
}

async function fromCurrencyAPI(apiKey: string, spreadPct: number): Promise<CurrencyRates | null> {
  if (!apiKey) { console.warn('[priceSync] CurrencyAPI: no API key'); return null; }
  try {
    const res = await fetch(`https://api.currencyapi.com/v3/latest?apikey=${apiKey}&base_currency=CAD`);
    if (!res.ok) throw new Error(`CurrencyAPI ${res.status}`);
    const data = (await res.json()) as { data: Record<string, { value: number }> };
    const map: CurrencyRates = new Map();
    for (const [code, entry] of Object.entries(data.data)) {
      if (code === 'CAD' || !entry.value || entry.value <= 0) continue;
      map.set(code, applySpread(1 / entry.value, spreadPct));
    }
    console.log(`[priceSync] CurrencyAPI: ${map.size} rates`);
    return map;
  } catch (err) {
    console.error('[priceSync] CurrencyAPI failed:', err);
    return null;
  }
}

// ── Gold source fetchers ───────────────────────────────────────────────────────

async function goldFromKitco(): Promise<number | null> {
  try {
    const res = await fetch('https://www.kitco.com/charts/gold', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5.1 Safari/605.1.15',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    if (!res.ok) throw new Error(`Kitco ${res.status}`);
    const html = await res.text();

    // Kitco embeds gold spot in __NEXT_DATA__ JSON under symbol:"AU", name:"Gold"
    // Pattern: "symbol":"AU","currency":"USD","name":"Gold","results":[{"ID":0,"ask":4703.8,"bid":4701.8,...
    const goldSection = html.match(/"symbol"\s*:\s*"AU"[^[]+\[([^\]]+)\]/);
    if (goldSection) {
      const askM = goldSection[1]!.match(/"ask"\s*:\s*([\d.]+)/);
      const bidM = goldSection[1]!.match(/"bid"\s*:\s*([\d.]+)/);
      const ask = askM ? parseFloat(askM[1]!) : 0;
      const bid = bidM ? parseFloat(bidM[1]!) : 0;
      if (ask > 1000 && bid > 1000) {
        const mid = (ask + bid) / 2;
        console.log(`[priceSync] Kitco gold: bid=$${bid.toFixed(2)} ask=$${ask.toFixed(2)} mid=$${mid.toFixed(2)} USD/oz`);
        return mid;
      }
    }

    throw new Error('Could not parse gold price from Kitco page');
  } catch (err) {
    console.error('[priceSync] Kitco gold failed:', err);
    return null;
  }
}

async function goldFromYahoo(): Promise<number | null> {
  try {
    const res = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&range=1d',
      { headers: { 'User-Agent': 'Mozilla/5.0' } },
    );
    if (!res.ok) throw new Error(`Yahoo ${res.status}`);
    const data = (await res.json()) as {
      chart: { result: Array<{ meta: { regularMarketPrice: number } }> };
    };
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    if (!price || price <= 0) throw new Error('Invalid price');
    console.log(`[priceSync] Yahoo gold: $${price.toFixed(2)} USD/oz`);
    return price;
  } catch (err) {
    console.error('[priceSync] Yahoo gold failed:', err);
    return null;
  }
}

async function goldFromMetalsAPI(apiKey: string): Promise<number | null> {
  if (!apiKey) { console.warn('[priceSync] Metals-API: no API key'); return null; }
  try {
    const res = await fetch(`https://metals-api.com/api/latest?access_key=${apiKey}&base=XAU&symbols=USD`);
    if (!res.ok) throw new Error(`Metals-API ${res.status}`);
    const data = (await res.json()) as { success: boolean; rates: { USD: number } };
    if (!data.success || !data.rates.USD) throw new Error('Metals-API failure');
    console.log(`[priceSync] Metals-API gold: $${data.rates.USD.toFixed(2)} USD/oz`);
    return data.rates.USD;
  } catch (err) {
    console.error('[priceSync] Metals-API failed:', err);
    return null;
  }
}

// Returns { goldUSD: USD/troy-oz, usdCad: USD/CAD mid } — both from one call
async function goldFromVBCEMetal(): Promise<{ goldUSD: number; usdCad: number } | null> {
  try {
    const res = await fetch(
      'https://rs1.smallfactory.dev/api/v1/metal_rates?apikey=bc9959c3faab76071c6fb348c509f7f32',
      {
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5.1 Safari/605.1.15',
          'Origin': 'https://www.vbce.ca',
          'Referer': 'https://www.vbce.ca/',
        },
      },
    );
    if (!res.ok) { console.error(`[priceSync] VBCE metal ${res.status}`); return null; }

    const list = (await res.json()) as Array<{
      name: string; metal_code: string; rate_code: string;
      us_bid: string; us_ask: string;
    }>;

    let goldUSD: number | null = null;
    let usdCad: number | null = null;

    for (const item of list) {
      if (item.metal_code === 'xauusd' || item.name === 'Gold') {
        const bid = parseFloat(item.us_bid);
        const ask = parseFloat(item.us_ask);
        if (bid > 0 && ask > 0) goldUSD = (bid + ask) / 2;
      }
      if (item.rate_code === 'usdcad' || item.name === 'USD/CAD') {
        const bid = parseFloat(item.us_bid);
        const ask = parseFloat(item.us_ask);
        if (bid > 0 && ask > 0) usdCad = (bid + ask) / 2;
      }
    }

    if (!goldUSD) { console.warn('[priceSync] VBCE metal: gold not found'); return null; }
    if (!usdCad)  { console.warn('[priceSync] VBCE metal: USD/CAD not found'); return null; }

    console.log(`[priceSync] VBCE metal: gold $${goldUSD.toFixed(2)} USD/oz · 1 USD = ${usdCad.toFixed(4)} CAD`);
    return { goldUSD, usdCad };
  } catch (err) {
    console.error('[priceSync] VBCE metal failed:', err);
    return null;
  }
}

async function goldFromGoldAPI(apiKey: string): Promise<number | null> {
  if (!apiKey) { console.warn('[priceSync] GoldAPI: no API key'); return null; }
  try {
    const res = await fetch('https://www.goldapi.io/api/XAU/USD', {
      headers: { 'x-access-token': apiKey, 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`GoldAPI ${res.status}`);
    const data = (await res.json()) as { price: number };
    if (!data.price || data.price <= 0) throw new Error('Invalid price');
    console.log(`[priceSync] GoldAPI: $${data.price.toFixed(2)} USD/oz`);
    return data.price;
  } catch (err) {
    console.error('[priceSync] GoldAPI failed:', err);
    return null;
  }
}

// ── VanEx intraday storage ────────────────────────────────────────────────────

async function storeVanExIntraday(existingRates: CurrencyRates | null): Promise<void> {
  try {
    const rates = existingRates ?? await fromVanEx(0);
    if (!rates) return;

    // Round to 15-min bucket so unique index stays clean
    const now = new Date();
    const bucket = Math.floor(now.getTime() / (15 * 60 * 1000)) * (15 * 60 * 1000);
    const recordedAt = new Date(bucket);

    const tracked = await CurrencyModel.find().lean();
    let count = 0;
    for (const cur of tracked) {
      const rate = rates.get(cur.code);
      if (!rate) continue;
      await CurrencyIntradayModel.updateOne(
        { code: cur.code, recordedAt },
        { $set: { buy: rate.buy, sell: rate.sell, code: cur.code, recordedAt } },
        { upsert: true },
      );
      count++;
    }
    console.log(`[priceSync] intraday: ${count} points stored at ${recordedAt.toISOString()}`);
  } catch (err) {
    console.error('[priceSync] intraday storage failed:', err);
  }
}

// ── Core sync ─────────────────────────────────────────────────────────────────

export async function syncPrices() {
  console.log('[priceSync] starting sync…');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const settings = await SettingsModel.findOne().lean() ?? await SettingsModel.create({});
  const spreadPct       = (settings as any).spread         ?? 1.5;
  const currencySource  = (settings as any).currencySource ?? 'vanex_scrape';
  const goldSource      = (settings as any).goldSource     ?? 'kitco';
  const apiKeys         = (settings as any).apiKeys        ?? {};

  // ── Fetch currency rates ──────────────────────────────────────────────────
  let currencyRates: CurrencyRates | null = null;

  switch (currencySource) {
    case 'vanex_scrape':         currencyRates = await fromVanEx(spreadPct); break;
    case 'vbce_scrape':          currencyRates = await fromVBCE(spreadPct); break;
    case 'arzsina_scrape':       currencyRates = await fromArzSina(spreadPct); break;
    case 'bank_of_canada':       currencyRates = await fromBankOfCanada(spreadPct); break;
    case 'frankfurter':          currencyRates = await fromFrankfurter(spreadPct); break;
    case 'open_er_api':          currencyRates = await fromOpenER(spreadPct); break;
    case 'open_exchange_rates':  currencyRates = await fromOpenExchangeRates(apiKeys.open_exchange_rates ?? '', spreadPct); break;
    case 'currency_api':         currencyRates = await fromCurrencyAPI(apiKeys.currency_api ?? '', spreadPct); break;
  }

  // ── Fetch gold price (waterfall — first success wins) ────────────────────
  let goldUSD: number | null = null;
  let vbceUsdCad: number | null = null;

  // Build ordered list: preferred source first, then fallbacks
  type GoldFetcher = () => Promise<number | { goldUSD: number; usdCad: number } | null>;
  const primaryFetchers: Array<{ name: string; fn: GoldFetcher }> = [];

  switch (goldSource) {
    case 'vbce_metal':    primaryFetchers.push({ name: 'vbce_metal',    fn: goldFromVBCEMetal }); break;
    case 'kitco':         primaryFetchers.push({ name: 'kitco',         fn: goldFromKitco }); break;
    case 'yahoo_finance': primaryFetchers.push({ name: 'yahoo_finance', fn: goldFromYahoo }); break;
    case 'metals_api':    primaryFetchers.push({ name: 'metals_api',    fn: () => goldFromMetalsAPI(apiKeys.metals_api ?? '') }); break;
    case 'gold_api':      primaryFetchers.push({ name: 'gold_api',      fn: () => goldFromGoldAPI(apiKeys.gold_api ?? '') }); break;
  }

  // Always append fallbacks (skipping the one already chosen as primary)
  const fallbacks: Array<{ name: string; fn: GoldFetcher }> = [
    { name: 'vbce_metal',    fn: goldFromVBCEMetal },
    { name: 'yahoo_finance', fn: goldFromYahoo },
    { name: 'kitco',         fn: goldFromKitco },
  ].filter(f => f.name !== goldSource);

  for (const { name, fn } of [...primaryFetchers, ...fallbacks]) {
    try {
      const result = await fn();
      if (!result) continue;
      if (typeof result === 'object' && 'goldUSD' in result) {
        goldUSD = result.goldUSD;
        vbceUsdCad = result.usdCad;
      } else if (typeof result === 'number' && result > 0) {
        goldUSD = result;
      }
      if (goldUSD && goldUSD > 0) {
        console.log(`[priceSync] gold sourced from: ${name}`);
        break;
      }
    } catch (e) {
      console.warn(`[priceSync] gold source ${name} threw:`, e);
    }
  }

  // Derive USD/CAD — prefer VBCE (already fetched), then currency rates, then open.er-api
  let usdCad: number | null = vbceUsdCad;
  if (!usdCad && currencyRates?.has('USD')) {
    const u = currencyRates.get('USD')!;
    usdCad = (u.buy + u.sell) / 2;
  }
  if (!usdCad) {
    try {
      const r = await fetch('https://open.er-api.com/v6/latest/USD');
      const d = (await r.json()) as { result: string; rates: Record<string, number> };
      if (d.result === 'success') usdCad = d.rates['CAD'] ?? null;
    } catch { /* ignore */ }
  }

  const goldCADperGramResolved: number | null =
    goldUSD !== null && usdCad !== null ? (goldUSD * usdCad) / TROY_OZ_GRAMS : null;

  // ── Validate gold price (reject weekend/stale anomalies) ─────────────────
  let validatedGold: number | null = goldCADperGramResolved;
  if (validatedGold !== null) {
    // Sanity bounds: 24K gold CAD/g should be between $100 and $600
    if (validatedGold < 100 || validatedGold > 600) {
      console.warn(`[priceSync] gold rejected — out of sanity range: $${validatedGold.toFixed(2)} CAD/g`);
      validatedGold = null;
    } else {
      // Compare against most recent stored value — reject if >25% deviation
      // Skip this check if last update was more than 7 days ago (stale data)
      const lastRecord = await GoldPriceHistoryModel
        .findOne({ karat: 24 })
        .sort({ recordedAt: -1 })
        .lean();
      if (lastRecord) {
        const ageMs = Date.now() - new Date((lastRecord as any).recordedAt).getTime();
        const stale = ageMs > 7 * 24 * 60 * 60 * 1000;
        if (!stale) {
          const lastPrice = lastRecord.pricePerGram;
          const deviation = Math.abs(validatedGold - lastPrice) / lastPrice;
          if (deviation > 0.25) {
            console.warn(`[priceSync] gold rejected — ${(deviation * 100).toFixed(1)}% deviation from last known $${lastPrice.toFixed(2)}: new $${validatedGold.toFixed(2)} CAD/g`);
            validatedGold = null;
          }
        } else {
          console.log(`[priceSync] gold — skipping deviation check (last record is stale: ${Math.round(ageMs / 86400000)}d old)`);
        }
      }
    }
  }

  // ── Write gold history ────────────────────────────────────────────────────
  if (validatedGold !== null) {
    const goldCADperGram = validatedGold;
    const karats: Array<{ karat: 10 | 14 | 18 | 22 | 24; fraction: number }> = [
      { karat: 10, fraction: 10 / 24 },
      { karat: 14, fraction: 14 / 24 },
      { karat: 18, fraction: 18 / 24 },
      { karat: 22, fraction: 22 / 24 },
      { karat: 24, fraction: 24 / 24 },
    ];
    for (const { karat, fraction } of karats) {
      const price = Math.round(goldCADperGram * fraction * 100) / 100;
      await GoldPriceModel.findOneAndUpdate({ karat }, { $set: { pricePerGram: price } }, { upsert: true, new: true });
      await GoldPriceHistoryModel.updateOne(
        { karat, recordedAt: today },
        { $set: { pricePerGram: price, karat, recordedAt: today } },
        { upsert: true },
      );
    }
    const usdNote = usdCad ? ` (1 USD = ${usdCad.toFixed(4)} CAD)` : '';
    console.log(`[priceSync] gold — 24K: $${goldCADperGram.toFixed(2)} CAD/g${usdNote}`);

    // Save Kitco spot price (USD/oz) so the frontend can display real spot instead of back-calculating
    if (goldUSD !== null) {
      const cadPerOz = usdCad ? goldUSD * usdCad : 0;
      await SpotPriceModel.create({
        metal:      'gold',
        priceUsd:   Math.round(goldUSD * 100) / 100,
        priceCad:   Math.round(cadPerOz * 100) / 100,
        bid:        0,
        ask:        0,
        change24h:  0,
        recordedAt: new Date(),
      });
    }
  }

  // ── Write currency history ────────────────────────────────────────────────
  if (currencyRates !== null) {
    const tracked = await CurrencyModel.find().lean();
    let updated = 0;
    for (const cur of tracked) {
      const rate = currencyRates.get(cur.code);
      if (!rate) { console.warn(`[priceSync] no rate for ${cur.code} — skipped`); continue; }
      await CurrencyModel.updateOne({ code: cur.code }, { buy: rate.buy, sell: rate.sell });
      await CurrencyPriceHistoryModel.updateOne(
        { code: cur.code, recordedAt: today },
        { $set: { buy: rate.buy, sell: rate.sell, code: cur.code, recordedAt: today } },
        { upsert: true },
      );
      updated++;
    }
    console.log(`[priceSync] ${updated} currencies updated (source: ${currencySource})`);
  }

  // Always store VanEx intraday snapshot — reuse already-fetched rates if VanEx is the active source
  await storeVanExIntraday(currencySource === 'vanex_scrape' ? currencyRates : null);

  console.log('[priceSync] done');
}

// ── Preview: fetch comparison rates for the admin currencies panel ───────────
// Competitor sources (vanex/vbce/arzsina/daniel) come from the last DB snapshot
// (populated by the 30-min competitor sync) — avoids 44+ outbound HTTP calls.
// Only BoC, Frankfurter, and open.er-api are fetched live (each is a single call).

export async function previewRates(): Promise<{
  sources: string[];
  rates: Record<string, Record<string, { buy: number; sell: number } | null>>;
}> {
  const settings = await SettingsModel.findOne().lean() ?? await SettingsModel.create({});
  const spread  = (settings as any).spread   ?? 1.5;
  const apiKeys = (settings as any).apiKeys  ?? {};

  const bySource: Record<string, CurrencyRates | null> = {};

  // ── Competitor DB sources (fast — last 30-min snapshot) ───────────────────
  const DB_SOURCES: Array<{ dbName: string; label: string }> = [
    { dbName: 'vanex',   label: 'vanex_scrape' },
    { dbName: 'vbce',    label: 'vbce_scrape' },
    { dbName: 'arzsina', label: 'arzsina_scrape' },
    { dbName: 'daniel',  label: 'daniel_scrape' },
  ];

  await Promise.all(DB_SOURCES.map(async ({ dbName, label }) => {
    try {
      const doc = await CompetitorRateModel.findOne({ source: dbName }).sort({ recordedAt: -1 }).lean();
      if (!doc) { bySource[label] = null; return; }
      const map: CurrencyRates = new Map();
      for (const entry of (doc as any).rates ?? []) {
        if (entry.code && entry.buy > 0 && entry.sell > 0) map.set(entry.code, { buy: entry.buy, sell: entry.sell });
      }
      bySource[label] = map.size > 0 ? map : null;
    } catch {
      bySource[label] = null;
    }
  }));

  // ── Live API sources (one HTTP call each, run in parallel) ────────────────
  const liveSources: Array<{ name: string; fn: () => Promise<CurrencyRates | null> }> = [
    { name: 'bank_of_canada', fn: () => fromBankOfCanada(spread) },
    { name: 'frankfurter',    fn: () => fromFrankfurter(spread) },
    { name: 'open_er_api',    fn: () => fromOpenER(spread) },
  ];
  if (apiKeys.open_exchange_rates)
    liveSources.push({ name: 'open_exchange_rates', fn: () => fromOpenExchangeRates(apiKeys.open_exchange_rates, spread) });
  if (apiKeys.currency_api)
    liveSources.push({ name: 'currency_api', fn: () => fromCurrencyAPI(apiKeys.currency_api, spread) });

  const liveResults = await Promise.allSettled(liveSources.map((s) => s.fn()));
  liveSources.forEach((s, i) => {
    const r = liveResults[i];
    bySource[s.name] = r?.status === 'fulfilled' ? r.value : null;
  });

  // ── Build response ────────────────────────────────────────────────────────
  const allCodes = new Set<string>();
  for (const rates of Object.values(bySource)) {
    if (rates) for (const code of rates.keys()) allCodes.add(code);
  }

  const rates: Record<string, Record<string, { buy: number; sell: number } | null>> = {};
  for (const code of allCodes) {
    rates[code] = {};
    for (const name of Object.keys(bySource)) {
      rates[code][name] = bySource[name]?.get(code) ?? null;
    }
  }

  const allSourceNames = [...DB_SOURCES.map((s) => s.label), ...liveSources.map((s) => s.name)];
  return { sources: allSourceNames, rates };
}

// ── Cron ──────────────────────────────────────────────────────────────────────

// Lightweight real-time gold spot sync — Kitco primary, Yahoo Finance fallback
// Only touches SpotPrice, never touches GoldPrice history
export async function syncGoldSpot(): Promise<void> {
  try {
    let priceUsd: number | null = null;
    let bid = 0;
    let ask = 0;

    // Primary: Kitco — real spot bid/ask (not futures)
    try {
      const res = await fetch('https://www.kitco.com/charts/gold', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5.1 Safari/605.1.15',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
      if (res.ok) {
        const html = await res.text();
        const goldSection = html.match(/"symbol"\s*:\s*"AU"[^[]+\[([^\]]+)\]/);
        if (goldSection) {
          const askM = goldSection[1]!.match(/"ask"\s*:\s*([\d.]+)/);
          const bidM = goldSection[1]!.match(/"bid"\s*:\s*([\d.]+)/);
          ask = askM ? parseFloat(askM[1]!) : 0;
          bid = bidM ? parseFloat(bidM[1]!) : 0;
          if (ask > 1000 && bid > 1000) {
            priceUsd = (ask + bid) / 2;
            console.log(`[spot] Kitco gold bid=$${bid.toFixed(2)} ask=$${ask.toFixed(2)} mid=$${priceUsd.toFixed(2)} USD/oz`);
          }
        }
      }
    } catch { /* fall through to Yahoo */ }

    // Fallback: Yahoo Finance GC=F futures
    if (!priceUsd) {
      const res = await fetch(
        'https://query1.finance.yahoo.com/v7/finance/quote?symbols=GC%3DF',
        { headers: { 'User-Agent': 'Mozilla/5.0' } },
      );
      if (!res.ok) throw new Error(`Yahoo quote ${res.status}`);
      const data = (await res.json()) as {
        quoteResponse: { result: Array<{ regularMarketPrice: number }> };
      };
      const p = data?.quoteResponse?.result?.[0]?.regularMarketPrice;
      if (!p || p < 1000) throw new Error(`Bad Yahoo gold quote: ${p}`);
      priceUsd = p;
      console.log(`[spot] Yahoo gold fallback $${priceUsd.toFixed(2)} USD/oz`);
    }

    // Get USD/CAD mid rate for CAD price
    let usdCad = 0;
    try {
      const fxRes = await fetch('https://open.er-api.com/v6/latest/USD', { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const fxData = (await fxRes.json()) as { result: string; rates: Record<string, number> };
      if (fxData.result === 'success') usdCad = fxData.rates['CAD'] ?? 0;
    } catch { /* use 0 if unavailable */ }

    await SpotPriceModel.create({
      metal:      'gold',
      priceUsd:   Math.round(priceUsd * 100) / 100,
      priceCad:   usdCad > 0 ? Math.round(priceUsd * usdCad * 100) / 100 : 0,
      bid:        Math.round(bid * 100) / 100,
      ask:        Math.round(ask * 100) / 100,
      change24h:  0,
      recordedAt: new Date(),
    });
  } catch (err) {
    console.warn('[spot] gold sync failed:', err);
  }
}

export function startPriceSync() {
  syncPrices().catch(console.error);
  cron.schedule('*/15 * * * *', () => syncPrices().catch(console.error));

  // Real-time gold spot — every 1 minute (lightweight Yahoo Finance quote)
  syncGoldSpot().catch(console.error);
  cron.schedule('* * * * *', () => syncGoldSpot().catch(console.error));

  // Competitor rates — every 5 min (also auto-applies target rates to CurrencyModel)
  syncCompetitorRates().catch(console.error);
  cron.schedule('*/5 * * * *', () => syncCompetitorRates().catch(console.error));

  console.log('[priceSync] scheduler started — spot 1 min · prices 15 min · competitor 5 min');
}
