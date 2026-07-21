import { getCurrencies, getGoldPrices, getGoldSpotPrice } from '@/lib/api';
import { site } from '@/lib/site';
import { SaveContactButton } from './SaveContactButton';
import { FintracBadge } from './FintracBadge';

export const revalidate = 60;

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

const GoldBarIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M3 9h18l-2 8H5L3 9zm2-4h14l1 3H4L6 5zm3 0V3h6v2H9z"/>
  </svg>
);

export default async function VCardPage() {
  let usd: { buy: number; sell: number } | null = null;
  let gold18: number | null = null;

  try {
    const [currencies, spot, goldPrices] = await Promise.all([getCurrencies(), getGoldSpotPrice(), getGoldPrices()]);
    const foundUsd = currencies.find((c: any) => c.code === 'USD');
    if (foundUsd) usd = { buy: foundUsd.buy, sell: foundUsd.sell };
    // Use live Kitco spot price (same formula as TV page), fallback to DB
    const TROY_OZ_GRAMS = 31.1035;
    gold18 = spot
      ? Math.round(spot.priceCad / TROY_OZ_GRAMS * (18 / 24) * 100) / 100
      : (goldPrices.find((g) => g.karat === 18)?.pricePerGram ?? null);
  } catch {}

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Unit 1102 Henderson Place Mall 1163 Pinetree Way Coquitlam BC')}`;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#060b17] p-4"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(180,140,40,0.15) 0%, #060b17 65%)' }}>

      <div className="w-full max-w-sm">

        {/* Card */}
        <div className="overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-b from-[#0e1729] to-[#080d19] shadow-2xl"
          style={{ boxShadow: '0 0 100px rgba(180,140,40,0.15), 0 32px 64px rgba(0,0,0,0.6)' }}>

          {/* Header — logo + name */}
          <div className="flex flex-col items-center px-8 pt-10 pb-6">
            {/* Logo glow ring */}
            <div className="relative mb-5">
              <div className="absolute inset-0 scale-125 rounded-full bg-amber-500/25 blur-2xl" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="Melli Exchange"
                width={88}
                height={88}
                className="relative rounded-2xl"
              />
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white">Melli Exchange</h1>
            <p className="mt-1 text-center text-xs font-medium uppercase tracking-[0.18em] text-amber-400/80 leading-5">
              Currency Exchange<br />
              &amp; Gold Jewelry
            </p>

            <FintracBadge />
          </div>

          {/* Promo video */}
          <div className="mx-5 mb-4 overflow-hidden rounded-2xl border border-white/10"
            style={{ aspectRatio: '16/9' }}>
            <video
              src="/tv-ad-1.mp4"
              autoPlay
              muted
              playsInline
              loop
              className="h-full w-full object-cover"
            />
          </div>

          {/* Live Rates */}
          {(usd || gold18 !== null) && (
            <div className="mx-5 mb-1 space-y-2.5">
              {/* Section label */}
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-white/8" />
                <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-white/30">Live Rates</span>
                <div className="h-px flex-1 bg-white/8" />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* USD / CAD */}
                {usd && (
                  <div className="rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-500/10 to-sky-500/5 p-3.5">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-sky-400/80">USD / CAD</p>
                      <span className="text-base">💵</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[10px] text-white/40">Buy</span>
                        <span className="text-sm font-bold text-white">{usd.buy.toFixed(4)}</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-[10px] text-white/40">Sell</span>
                        <span className="text-sm font-bold text-white">{usd.sell.toFixed(4)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Gold 18K */}
                {gold18 !== null && (
                  <div className="rounded-2xl border border-amber-400/30 p-3.5"
                    style={{ background: 'linear-gradient(135deg, rgba(217,170,50,0.15) 0%, rgba(180,130,30,0.08) 100%)' }}>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-amber-300/90">طلا ۱۸ عیار</p>
                      <span className="text-amber-400/80"><GoldBarIcon /></span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[10px] text-white/40">هر گرم</span>
                        <span className="text-sm font-bold text-amber-200">CA${gold18.toFixed(2)}</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-[10px] text-white/40">USD</span>
                        <span className="text-[10px] font-semibold text-amber-400/60">
                          {usd ? `$${(gold18 / usd.sell).toFixed(2)}` : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="mx-5 my-4 h-px bg-white/6" />

          {/* Contact items */}
          <div className="space-y-1 px-5 pb-2">

            <a href={`tel:+17787527386`}
              className="flex items-center gap-3.5 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/5 active:bg-white/8">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-amber-500/15 text-sm">📞</span>
              <div>
                <p className="text-[10px] text-white/40">Phone</p>
                <p className="text-sm font-medium text-white">+1 (778) 752-7386</p>
              </div>
            </a>

            <a href={`tel:+18778677090`}
              className="flex items-center gap-3.5 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/5 active:bg-white/8">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-amber-500/15 text-sm">📞</span>
              <div>
                <p className="text-[10px] text-white/40">Toll Free</p>
                <p className="text-sm font-medium text-white">1-877-867-7090</p>
              </div>
            </a>

            <a href={`mailto:${site.email}`}
              className="flex items-center gap-3.5 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/5 active:bg-white/8">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-amber-500/15 text-sm">✉️</span>
              <div>
                <p className="text-[10px] text-white/40">Email</p>
                <p className="text-sm font-medium text-white">{site.email}</p>
              </div>
            </a>

            <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3.5 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/5 active:bg-white/8">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-amber-500/15 text-sm">📍</span>
              <div>
                <p className="text-[10px] text-white/40">Address</p>
                <p className="text-sm font-medium leading-snug text-white">Unit 1102, Henderson Place Mall<br />Coquitlam, BC V3B 8A9</p>
              </div>
            </a>

            <a href={site.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3.5 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/5 active:bg-white/8">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-amber-500/15 text-sm">🌐</span>
              <div>
                <p className="text-[10px] text-white/40">Website</p>
                <p className="text-sm font-medium text-white">www.melliexchange.ca</p>
              </div>
            </a>

          </div>

          {/* Divider */}
          <div className="mx-5 my-4 h-px bg-white/6" />

          {/* Social links */}
          <div className="flex gap-3 px-5 pb-5">
            <a href={site.social.instagram} target="_blank" rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-white/80 transition-colors hover:border-pink-400/30 hover:bg-pink-500/10 hover:text-pink-300">
              <InstagramIcon />
              Instagram
            </a>
            <a href={site.social.telegram} target="_blank" rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-white/80 transition-colors hover:border-sky-400/30 hover:bg-sky-500/10 hover:text-sky-300">
              <TelegramIcon />
              Telegram
            </a>
          </div>

          {/* Save contact CTA */}
          <div className="px-5 pb-7">
            <SaveContactButton />
          </div>

        </div>

        <p className="mt-4 text-center text-[10px] text-white/20">
          melliexchange.ca · Open 7 days a week
        </p>
      </div>
    </main>
  );
}
