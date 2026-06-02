import * as cheerio from 'cheerio';
import { CompetitorRateModel } from './models/CompetitorRate.js';
import { SpotPriceModel } from './models/SpotPrice.js';
import { RateAlertModel } from './models/RateAlert.js';
import { getSettings } from './models/Settings.js';

type RateMap = Record<string, { buy: number; sell: number }>;

// ── Vanex RSC scrape ─────────────────────────────────────────────────────────
// Vanex is a Next.js CSR app — the plain HTML page has no rate data in it.
// Sending the RSC:1 header triggers the server-rendered data payload which
// contains currency objects with buyCash / sellCash (cash desk rates).

async function scrapeVanex(): Promise<RateMap> {
  const res = await fetch('https://vanexgroup.com/en/liveRate', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5.1 Safari/605.1.15',
      'Accept': 'text/html,application/xhtml+xml,*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'RSC': '1',
    },
  });
  if (!res.ok) throw new Error(`Vanex RSC ${res.status}`);
  const text = await res.text();

  const map: RateMap = {};
  // RSC payload embeds JSON objects: {"iso":"USD","isoName":"...","buyCash":1.36,"sellCash":1.39,...}
  // buyCash = exchange pays customer for their foreign cash (our "buy")
  // sellCash = exchange charges customer for foreign cash (our "sell")
  for (const m of text.matchAll(/\{"iso":"([A-Z]{2,4})"[^}]+"buyCash":([\d.]+)[^}]+"sellCash":([\d.]+)/g)) {
    const code = m[1]!;
    if (code === 'CAD' || map[code]) continue;
    const buy  = parseFloat(m[2]!);
    const sell = parseFloat(m[3]!);
    if (buy > 0 && sell > 0) map[code] = { buy, sell };
  }

  if (Object.keys(map).length === 0) throw new Error('Vanex RSC: no rates parsed from payload');
  return map;
}

// ── ArzSina cheerio scrape ───────────────────────────────────────────────────

async function scrapeArzSina(): Promise<RateMap> {
  const res = await fetch('https://arzsina.com/cash-exchange-rates/', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
    },
  });
  if (!res.ok) throw new Error(`ArzSina ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  const map: RateMap = {};

  // ArzSina table: [flag-img | code | name (hidden) | buys-at | sells-at]
  $('table.table tr').each((_i, row) => {
    const cells = $(row).find('td');
    if (cells.length < 5) return;

    const code = $(cells[1]).text().trim().toUpperCase();
    if (!/^[A-Z]{2,4}$/.test(code)) return;

    const buy  = parseFloat($(cells[3]).text().replace(/,/g, '').trim());
    const sell = parseFloat($(cells[4]).text().replace(/,/g, '').trim());
    if (buy > 0 && sell > 0) map[code] = { buy, sell };
  });

  // Regex fallback: <td>\nUSD\n</td> <td class="...">Dollars</td> <td>1.34</td> <td>1.37</td>
  if (Object.keys(map).length === 0) {
    const rows = [...html.matchAll(/<td[^>]*>\s*([A-Z]{2,4})\s*<\/td>\s*<td[^>]*>[^<]*<\/td>\s*<td[^>]*>([\d.]+)<\/td>\s*<td[^>]*>([\d.]+)<\/td>/g)];
    for (const [, code, b, s] of rows) {
      const buy = parseFloat(b ?? '0');
      const sell = parseFloat(s ?? '0');
      if (code && buy > 0 && sell > 0) map[code] = { buy, sell };
    }
  }

  return map;
}

// ── Daniel Exchange scrape ───────────────────────────────────────────────────

// Daniel Exchange non-standard codes → ISO
const DANIEL_CODE_MAP: Record<string, string> = { YEN: 'JPY' };

async function scrapeDaniel(): Promise<RateMap> {
  const res = await fetch('http://www.danielexchange.com/en/', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5.1 Safari/605.1.15',
      'Accept': 'text/html,application/xhtml+xml',
    },
  });
  if (!res.ok) throw new Error(`Daniel ${res.status}`);
  const html = await res.text();

  // Rates are embedded as: var fmRates = JSON.parse('{"USD":{"b":"1.345","s":"1.372"},...}');
  const match = html.match(/var\s+fmRates\s*=\s*JSON\.parse\('(.+?)'\)/);
  if (!match?.[1]) throw new Error('Daniel: fmRates not found');

  const raw: Record<string, { b: string; s: string }> = JSON.parse(match[1]);
  const map: RateMap = {};

  for (const [rawCode, { b, s }] of Object.entries(raw)) {
    if (rawCode === 'CAD') continue; // base currency
    const code = DANIEL_CODE_MAP[rawCode] ?? rawCode;
    const buy  = parseFloat(b);
    const sell = parseFloat(s);
    if (buy > 0 && sell > 0) map[code] = { buy, sell };
  }

  return map;
}

// ── MoneyWay scrape ──────────────────────────────────────────────────────────
// Rates are PHP-rendered into the HTML as: const cashCurrencyRates = [{...}, ...]
// MoneyWay labels buy/sell from the customer's perspective (inverted from ours):
//   their "buy"  = customer buys foreign currency  = exchange sells = higher number
//   their "sell" = customer sells foreign currency = exchange buys  = lower number
// We normalise so that stored buy < sell (exchange perspective).

async function scrapeMoneyWay(): Promise<RateMap> {
  const res = await fetch('https://www.moneyway.com/rates/currencies', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5.1 Safari/605.1.15',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });
  if (!res.ok) throw new Error(`MoneyWay HTML ${res.status}`);
  const html = await res.text();

  const startIdx = html.indexOf('cashCurrencyRates');
  if (startIdx === -1) throw new Error('MoneyWay: cashCurrencyRates not found in page');
  const arrStart = html.indexOf('[', startIdx);
  if (arrStart === -1) throw new Error('MoneyWay: array bracket not found');

  // Walk brackets to find the closing ] of the cashCurrencyRates array
  let depth = 0, arrEnd = -1;
  for (let i = arrStart; i < Math.min(arrStart + 50_000, html.length); i++) {
    const ch = html[i];
    if (ch === '[' || ch === '{') depth++;
    else if (ch === ']' || ch === '}') {
      depth--;
      if (depth === 0) { arrEnd = i; break; }
    }
  }
  if (arrEnd === -1) throw new Error('MoneyWay: unclosed array in page');

  let items: Array<Record<string, unknown>>;
  try {
    items = JSON.parse(html.slice(arrStart, arrEnd + 1));
  } catch {
    throw new Error('MoneyWay: JSON parse failed for cashCurrencyRates');
  }

  const map: RateMap = {};
  for (const item of items) {
    const code = String(item['code'] ?? '').trim().toUpperCase();
    if (!code || code === 'CAD' || !/^[A-Z]{2,4}$/.test(code)) continue;
    const a = parseFloat(String(item['buy'] ?? '0'));
    const b = parseFloat(String(item['sell'] ?? '0'));
    if (!isFinite(a) || !isFinite(b) || a <= 0 || b <= 0) continue;
    // Normalise to exchange perspective: buy (lower) = what exchange pays, sell (higher) = what exchange charges
    if (!map[code]) map[code] = { buy: Math.min(a, b), sell: Math.max(a, b) };
  }

  if (Object.keys(map).length === 0) throw new Error('MoneyWay: no rates parsed');
  return map;
}

// ── VBCE API ─────────────────────────────────────────────────────────────────

async function scrapeVBCE(): Promise<RateMap> {
  const res = await fetch(
    'https://rs1.smallfactory.dev/api/v1/rates?apikey=bc9959c3faab76071c6fb348c509f7f32',
    { headers: { 'Accept': 'application/json', 'Origin': 'https://www.vbce.ca', 'Referer': 'https://www.vbce.ca/' } },
  );
  if (!res.ok) throw new Error(`VBCE ${res.status}`);
  const raw = await res.json();
  const list: Array<Record<string, string>> = Array.isArray(raw) ? raw : (raw as any)?.data ?? [];

  const map: RateMap = {};
  for (const r of list) {
    const code = (r['iso'] ?? r['iso_code'] ?? r['currency'] ?? '').toUpperCase();
    const buy  = parseFloat(r['buy_price'] ?? r['buyPrice'] ?? r['buy'] ?? '0');
    const sell = parseFloat(r['sell_price'] ?? r['sellPrice'] ?? r['sell'] ?? '0');
    if (code && buy > 0 && sell > 0) map[code] = { buy, sell };
  }
  return map;
}

// ── Kitco spot price scrape ──────────────────────────────────────────────────

export async function scrapeKitco(): Promise<{ gold: number; silver: number; goldChange: number; silverChange: number } | null> {
  try {
    // Try Yahoo Finance as primary (reliable, same data Kitco shows)
    const [goldRes, silverRes] = await Promise.all([
      fetch('https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&range=5d', { headers: { 'User-Agent': 'Mozilla/5.0' } }),
      fetch('https://query1.finance.yahoo.com/v8/finance/chart/SI=F?interval=1d&range=5d', { headers: { 'User-Agent': 'Mozilla/5.0' } }),
    ]);

    if (!goldRes.ok || !silverRes.ok) throw new Error('Yahoo Finance failed');

    const gd = (await goldRes.json()) as { chart: { result: Array<{ meta: { regularMarketPrice: number; previousClose: number } }> } };
    const sd = (await silverRes.json()) as { chart: { result: Array<{ meta: { regularMarketPrice: number; previousClose: number } }> } };

    const goldPrice   = gd?.chart?.result?.[0]?.meta?.regularMarketPrice ?? 0;
    const goldPrev    = gd?.chart?.result?.[0]?.meta?.previousClose ?? goldPrice;
    const silverPrice = sd?.chart?.result?.[0]?.meta?.regularMarketPrice ?? 0;
    const silverPrev  = sd?.chart?.result?.[0]?.meta?.previousClose ?? silverPrice;

    if (!goldPrice || !silverPrice) throw new Error('Zero prices');

    return {
      gold:         goldPrice,
      silver:       silverPrice,
      goldChange:   goldPrev ? ((goldPrice - goldPrev) / goldPrev) * 100 : 0,
      silverChange: silverPrev ? ((silverPrice - silverPrev) / silverPrev) * 100 : 0,
    };
  } catch (yahooErr) {
    // Fallback: scrape Kitco homepage
    try {
      const res = await fetch('https://www.kitco.com', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
      });
      if (!res.ok) throw new Error(`Kitco ${res.status}`);
      const $ = cheerio.load(await res.text());

      const extract = (selector: string): number => {
        const text = $(selector).first().text().replace(/[$,\s]/g, '');
        return parseFloat(text) || 0;
      };

      // Kitco's page typically has #goldbid or similar — try common selectors
      const gold   = extract('#goldbid') || extract('[data-gold-price]') || extract('.gold-price');
      const silver = extract('#silverbid') || extract('[data-silver-price]') || extract('.silver-price');

      if (gold > 0 && silver > 0) {
        return { gold, silver, goldChange: 0, silverChange: 0 };
      }
      throw new Error('Could not parse Kitco');
    } catch (kitcoErr) {
      console.error('[competitorSync] Kitco/Yahoo failed:', kitcoErr);
      return null;
    }
  }
}

// ── Alert sender ──────────────────────────────────────────────────────────────

async function sendAlerts(alerts: Array<{ currency: string; source: string; fromRate: number; toRate: number; changePct: number }>) {
  const settings = await getSettings();
  const cfg = (settings as any).alerts ?? {};
  if (!cfg.enabled) return;

  for (const a of alerts) {
    const direction = a.toRate > a.fromRate ? 'jumped' : 'dropped';
    const msg = `⚠️ RATE ALERT: ${a.currency} ${direction} ${Math.abs(a.changePct).toFixed(2)}% in last 30 min.\n${a.source}: ${a.fromRate.toFixed(4)} → ${a.toRate.toFixed(4)}\nCheck admin panel.`;

    let sentEmail = false;
    let sentSms   = false;

    // Email via nodemailer
    if (cfg.email && cfg.smtpHost) {
      try {
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.default.createTransport({
          host: cfg.smtpHost,
          port: cfg.smtpPort ?? 587,
          secure: (cfg.smtpPort ?? 587) === 465,
          auth: cfg.smtpUser ? { user: cfg.smtpUser, pass: cfg.smtpPass } : undefined,
        });
        await transporter.sendMail({
          from: cfg.smtpUser || 'alerts@melliexchange.ca',
          to:   cfg.email,
          subject: `Rate Alert: ${a.currency} ${direction} ${Math.abs(a.changePct).toFixed(2)}%`,
          text: msg,
        });
        sentEmail = true;
        console.log(`[alerts] email sent for ${a.currency}`);
      } catch (e) {
        console.error('[alerts] email failed:', e);
      }
    }

    // SMS via Twilio
    if (cfg.phone && cfg.twilioSid && cfg.twilioToken && cfg.twilioFrom) {
      try {
        const twilio = await import('twilio');
        const client = (twilio.default as any)(cfg.twilioSid, cfg.twilioToken);
        await client.messages.create({ body: msg, from: cfg.twilioFrom, to: cfg.phone });
        sentSms = true;
        console.log(`[alerts] SMS sent for ${a.currency}`);
      } catch (e) {
        console.error('[alerts] SMS failed:', e);
      }
    }

    await RateAlertModel.create({
      currency: a.currency,
      source:   a.source,
      fromRate: a.fromRate,
      toRate:   a.toRate,
      changePct: a.changePct,
      message:  msg,
      sentEmail,
      sentSms,
    });
  }
}

// ── Rate jump detection ────────────────────────────────────────────────────────

async function detectJumps(source: string, current: RateMap) {
  const settings = await getSettings();
  const threshold = (settings as any).alerts?.thresholdPct ?? 0.5;

  const prev = await CompetitorRateModel.findOne({ source }).sort({ recordedAt: -1 }).skip(1).lean();
  if (!prev) return;

  const prevRates: RateMap = {};
  for (const r of (prev as any).rates ?? []) prevRates[r.code] = { buy: r.buy, sell: r.sell };

  const jumps: Array<{ currency: string; source: string; fromRate: number; toRate: number; changePct: number }> = [];

  for (const [code, cur] of Object.entries(current)) {
    const old = prevRates[code];
    if (!old) continue;
    const midCur = (cur.buy + cur.sell) / 2;
    const midOld = (old.buy + old.sell) / 2;
    const pct = Math.abs((midCur - midOld) / midOld) * 100;
    if (pct >= threshold) {
      jumps.push({ currency: code, source, fromRate: midOld, toRate: midCur, changePct: (midCur - midOld) / midOld * 100 });
    }
  }

  if (jumps.length > 0) {
    console.log(`[competitorSync] ${jumps.length} rate jump(s) detected from ${source}`);
    await sendAlerts(jumps);
  }
}

// ── Main competitor sync ──────────────────────────────────────────────────────

export async function syncCompetitorRates() {
  console.log('[competitorSync] starting…');
  const now = new Date();

  const sources: Array<{ name: 'vanex' | 'arzsina' | 'vbce' | 'daniel' | 'moneyway'; fn: () => Promise<RateMap> }> = [
    { name: 'vanex',    fn: scrapeVanex },
    { name: 'arzsina',  fn: scrapeArzSina },
    { name: 'vbce',     fn: scrapeVBCE },
    { name: 'daniel',   fn: scrapeDaniel },
    { name: 'moneyway', fn: scrapeMoneyWay },
  ];

  for (const { name, fn } of sources) {
    try {
      const rates = await fn();
      const count = Object.keys(rates).length;
      if (count === 0) { console.warn(`[competitorSync] ${name}: 0 rates`); continue; }

      const ratesArr = Object.entries(rates).map(([code, r]) => ({ code, buy: r.buy, sell: r.sell }));
      await CompetitorRateModel.create({ source: name, recordedAt: now, rates: ratesArr });
      await detectJumps(name, rates);
      console.log(`[competitorSync] ${name}: ${count} rates saved`);
    } catch (e) {
      console.error(`[competitorSync] ${name} failed:`, e);
    }
  }

  // Kitco spot prices
  try {
    const spot = await scrapeKitco();
    if (spot) {
      // Get USD/CAD for conversion
      let usdCad = 1.36;
      try {
        const r = await fetch('https://open.er-api.com/v6/latest/USD');
        const d = (await r.json()) as { result: string; rates: Record<string, number> };
        if (d.result === 'success') usdCad = d.rates['CAD'] ?? usdCad;
      } catch { /* use default */ }

      await Promise.all([
        SpotPriceModel.create({ metal: 'gold',   priceUsd: spot.gold,   priceCad: spot.gold   * usdCad, change24h: spot.goldChange,   recordedAt: now }),
        SpotPriceModel.create({ metal: 'silver', priceUsd: spot.silver, priceCad: spot.silver * usdCad, change24h: spot.silverChange, recordedAt: now }),
      ]);
      console.log(`[competitorSync] spot: gold $${spot.gold.toFixed(2)}, silver $${spot.silver.toFixed(2)}`);
    }
  } catch (e) {
    console.error('[competitorSync] spot failed:', e);
  }

  console.log('[competitorSync] done');
}
