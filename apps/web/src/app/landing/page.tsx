import { getCurrencies, getGoldPrices, getGoldSpotPrice } from '@/lib/api';
import { site } from '@/lib/site';

// Revalidate every 60 s so rates stay fresh on cached requests
export const revalidate = 60;

const SHOW_CURRENCIES = ['USD', 'EUR', 'AED', 'GBP'];

const FLAG: Record<string, string> = {
  USD: '🇺🇸', EUR: '🇪🇺', AED: '🇦🇪', GBP: '🇬🇧',
};

function fmt(n: number, digits = 4) {
  return n.toLocaleString('en-CA', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function timeLabel(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diff < 1) return 'Just updated';
  if (diff === 1) return '1 min ago';
  if (diff < 60) return `${diff} min ago`;
  return `${Math.floor(diff / 60)}h ago`;
}

// ── SVG icons ─────────────────────────────────────────────────────────────────
function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.31a16 16 0 0 0 6.6 6.6l1.27-.78a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  );
}

function MapIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function LandingPage() {
  const [currencies, gold, spot] = await Promise.all([
    getCurrencies(),
    getGoldPrices(),
    getGoldSpotPrice(),
  ]);

  const shownCurrencies = SHOW_CURRENCIES
    .map((code) => currencies.find((c) => c.code === code))
    .filter(Boolean) as typeof currencies;

  const gold18 = gold.find((g) => g.karat === 18);
  const gold24 = gold.find((g) => g.karat === 24);

  const lastUpdated = shownCurrencies[0]?.updatedAt
    ? timeLabel(shownCurrencies[0].updatedAt)
    : null;

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${site.address.street}, ${site.address.city}, ${site.address.region} ${site.address.postal}`
  )}`;

  return (
    <div className="mx-auto min-h-screen max-w-sm px-4 py-8 pb-16">

      {/* ── Header ── */}
      <header className="mb-8 text-center">
        {/* Logo circle */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-gold-500 to-amber-600 shadow-lg shadow-gold-900/40">
          <span className="text-2xl font-black text-white">M</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">{site.name}</h1>
        <p className="mt-1 text-sm text-zinc-400">Currency Exchange &amp; Gold · Coquitlam, BC</p>

        {/* Live badge */}
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          {lastUpdated ? `Live · ${lastUpdated}` : 'Live Rates'}
        </div>
      </header>

      {/* ── Currency Rates ── */}
      <section className="mb-6">
        <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-gold-400">
          <span className="h-px flex-1 bg-gold-500/20" />
          Exchange Rates
          <span className="h-px flex-1 bg-gold-500/20" />
        </h2>

        {/* Column headers */}
        <div className="mb-1.5 grid grid-cols-[1fr_auto_auto] gap-x-4 px-4 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
          <span>Currency</span>
          <span className="text-right">We Buy</span>
          <span className="text-right">We Sell</span>
        </div>

        <div className="flex flex-col gap-2">
          {shownCurrencies.length === 0 ? (
            <div className="rounded-xl border border-white/5 bg-white/5 py-8 text-center text-sm text-zinc-500">
              Rates updating — please check back shortly
            </div>
          ) : (
            shownCurrencies.map((c) => (
              <div
                key={c.code}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 rounded-xl border border-white/5 bg-white/[0.04] px-4 py-3.5 transition-colors"
              >
                {/* Left: flag + code + name */}
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl leading-none">{FLAG[c.code] ?? c.flag}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-white">{c.code}</div>
                    <div className="truncate text-xs text-zinc-500">{c.name}</div>
                  </div>
                </div>

                {/* Buy */}
                <div className="text-right">
                  <div className="text-sm font-semibold tabular-nums text-emerald-400">{fmt(c.buy)}</div>
                  <div className="text-[10px] text-zinc-600">CAD</div>
                </div>

                {/* Sell */}
                <div className="text-right">
                  <div className="text-sm font-semibold tabular-nums text-gold-400">{fmt(c.sell)}</div>
                  <div className="text-[10px] text-zinc-600">CAD</div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ── Gold Prices ── */}
      <section className="mb-6">
        <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-gold-400">
          <span className="h-px flex-1 bg-gold-500/20" />
          Gold Prices
          <span className="h-px flex-1 bg-gold-500/20" />
        </h2>

        <div className="flex flex-col gap-2">
          {/* 18K gold — primary */}
          {gold18 ? (
            <div className="flex items-center justify-between rounded-xl border border-gold-500/20 bg-gradient-to-r from-gold-900/30 to-amber-900/20 px-4 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🥇</span>
                  <span className="text-sm font-bold text-white">18K Gold</span>
                  <span className="rounded-full bg-gold-500/20 px-2 py-0.5 text-[10px] font-semibold text-gold-400">Per Gram</span>
                </div>
                <div className="mt-0.5 text-xs text-zinc-500">طلای ۱۸ عیار</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-black tabular-nums text-gold-300">
                  ${gold18.pricePerGram.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-zinc-500">CAD / gram</div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-gold-500/10 bg-white/[0.03] px-4 py-4 text-center text-sm text-zinc-500">
              Gold price updating…
            </div>
          )}

          {/* Spot price */}
          {spot ? (
            <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.04] px-4 py-3.5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base">📊</span>
                  <span className="text-sm font-semibold text-white">Spot Price</span>
                </div>
                <div className="mt-0.5 text-xs text-zinc-500">Kitco · اونس جهانی</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold tabular-nums text-zinc-200">
                  ${spot.priceUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-zinc-500">USD / troy oz</div>
              </div>
            </div>
          ) : null}
        </div>

        <p className="mt-2.5 text-center text-[10px] leading-relaxed text-zinc-600">
          Indicative rates · Confirmed at counter · قیمت‌ها تقریبی است
        </p>
      </section>

      {/* ── Action Buttons ── */}
      <section className="mb-6">
        <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-gold-400">
          <span className="h-px flex-1 bg-gold-500/20" />
          Connect
          <span className="h-px flex-1 bg-gold-500/20" />
        </h2>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Website */}
          <a
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10 active:scale-95"
          >
            <GlobeIcon />
            Website
          </a>

          {/* Telegram */}
          <a
            href={site.social.telegram}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl border border-sky-500/20 bg-sky-500/10 py-3.5 text-sm font-semibold text-sky-400 transition-colors hover:bg-sky-500/20 active:scale-95"
          >
            <TelegramIcon />
            Telegram
          </a>

          {/* Instagram */}
          <a
            href={site.social.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="col-span-2 flex items-center justify-center gap-2 rounded-xl border border-pink-500/20 bg-gradient-to-r from-pink-500/10 to-purple-500/10 py-3.5 text-sm font-semibold text-pink-400 transition-colors hover:from-pink-500/20 hover:to-purple-500/20 active:scale-95"
          >
            <InstagramIcon />
            Instagram
          </a>

          {/* Call primary */}
          <a
            href={`tel:${(site.phones[0] ?? '').replace(/\D/g, '')}`}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-600 to-amber-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-gold-900/40 transition-all hover:from-gold-500 hover:to-amber-400 active:scale-95"
          >
            <PhoneIcon />
            {site.phones[0]}
          </a>

          {/* Call secondary */}
          <a
            href={`tel:${(site.phones[1] ?? '').replace(/\D/g, '')}`}
            className="flex items-center justify-center gap-2 rounded-xl border border-gold-500/30 bg-gold-500/10 py-3.5 text-sm font-semibold text-gold-400 transition-colors hover:bg-gold-500/20 active:scale-95"
          >
            <PhoneIcon />
            {site.phones[1]}
          </a>
        </div>
      </section>

      {/* ── Location & Hours ── */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-gold-400">
          <span className="h-px flex-1 bg-gold-500/20" />
          Find Us
          <span className="h-px flex-1 bg-gold-500/20" />
        </h2>

        <div className="flex flex-col gap-2">
          {/* Address — links to Google Maps */}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.04] px-4 py-3.5 transition-colors hover:bg-white/[0.07] active:scale-95"
          >
            <MapIcon />
            <div>
              <div className="text-sm font-semibold text-white">{site.address.street}</div>
              <div className="text-xs text-zinc-400">{site.address.city}, {site.address.region} {site.address.postal}</div>
              <div className="mt-1 text-xs font-medium text-gold-400">Get Directions →</div>
            </div>
          </a>

          {/* Hours */}
          <div className="rounded-xl border border-white/5 bg-white/[0.04] px-4 py-3.5">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-zinc-400">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              Hours
            </div>
            <ul className="space-y-1">
              {site.hours.map((h) => (
                <li key={h.days} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">{h.days}</span>
                  <span className="font-medium text-white">{h.time}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="mt-10 text-center">
        <div className="text-[10px] text-zinc-600">
          Rates updated every minute · FINTRAC Licensed
        </div>
        <div className="mt-1 text-[10px] text-zinc-700">
          {site.url.replace('https://', '')}
        </div>
      </footer>

    </div>
  );
}
