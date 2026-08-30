'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

interface Currency    { code: string; name: string; flag: string; buy: number; sell: number; }
interface GoldPrice   { karat: number; pricePerGram: number; }
interface SpotPrice   { priceUsd: number; priceCad: number; }
interface TgjuPrices  { geram18: string | null; ons: string | null; mithqal: string | null; tedpix: string | null; }
interface PricePoint  { t: number; p: number; }

const CURRENCY_FA: Record<string, string> = { USD: 'دلار آمریکا', EUR: 'یورو', GBP: 'پوند انگلیس' };

function toFlagEmoji(code: string): string {
  return code.toUpperCase().replace(/./g, c =>
    String.fromCodePoint(0x1F1E6 - 65 + c.charCodeAt(0))
  );
}

function fmtBuy(n: number)  { return (Math.floor(n * 100) / 100).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtSell(n: number) { return (Math.ceil(n  * 100) / 100).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtGold(n: number) { return n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

/* ── Live clock ── */
function Clock({ lang }: { lang: 'en' | 'fa' }) {
  const [t, setT] = useState('');
  const [d, setD] = useState('');
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setT(now.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
      setD(now.toLocaleDateString(lang === 'fa' ? 'fa-IR' : 'en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lang]);
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: '2.2vw', fontWeight: 800, color: '#fff', letterSpacing: '0.06em', fontVariantNumeric: 'tabular-nums' }}>{t}</div>
      <div style={{ fontSize: '0.85vw', color: '#7a8eaf', marginTop: '0.2vw' }}>{d}</div>
    </div>
  );
}

/* ── Animated number ── */
function AnimNum({ value, fmt: f }: { value: number; fmt: (n: number) => string }) {
  const [display, setDisplay] = useState(value);
  const [flash, setFlash] = useState(false);
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current !== value) { setFlash(true); setTimeout(() => setFlash(false), 600); prev.current = value; }
    setDisplay(value);
  }, [value]);
  return <span style={{ transition: 'color 0.4s', color: flash ? '#fff' : 'inherit' }}>{f(display)}</span>;
}

/* ── Gold sparkline chart ── */
function GoldSparkline({ history }: { history: PricePoint[] }) {
  if (history.length < 2) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#3a4a6a', fontSize: '0.75vw' }}>
        Accumulating data…
      </div>
    );
  }
  const prices = history.map(h => h.p);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const W = 200;
  const H = 60;
  const pts = history.map((h, i) => {
    const x = (i / (history.length - 1)) * W;
    const y = H - ((h.p - min) / range) * (H - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const last = history[history.length - 1]!;
  const first = history[0]!;
  const rising = last.p >= first.p;
  const color = rising ? '#4ade80' : '#f87171';
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%' }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* fill area */}
      <polygon
        points={`0,${H} ${pts} ${W},${H}`}
        fill="url(#sparkGrad)"
      />
      {/* line */}
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      {/* min/max labels */}
      <text x="2" y={H - 2} fill="#7a8eaf" fontSize="7">${min.toFixed(0)}</text>
      <text x="2" y="8"     fill="#7a8eaf" fontSize="7">${max.toFixed(0)}</text>
    </svg>
  );
}

const LOCAL_VIDEOS = ['/tv-ad-1.mp4', '/tv-ad-2.mp4'];

export default function TVDisplay({
  initialCurrencies, initialGold, initialSpot,
}: {
  initialCurrencies: Currency[];
  initialGold: GoldPrice[];
  initialSpot: SpotPrice | null;
}) {
  const [currencies, setCurrencies]   = useState(initialCurrencies);
  const [gold, setGold]               = useState(initialGold);
  const [spot, setSpot]               = useState(initialSpot);
  const [tgju, setTgju]               = useState<TgjuPrices>({ geram18: null, ons: null, mithqal: null, tedpix: null });
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [pulse, setPulse]             = useState(false);
  const [lang, setLang]               = useState<'en' | 'fa'>('en');
  const [langVisible, setLangVisible] = useState(true);
  const [videoIdx, setVideoIdx]       = useState(0);
  const [musicOn, setMusicOn]         = useState(false);
  const [showTapOverlay, setShowTapOverlay] = useState(true);
  const videoRef                      = useRef<HTMLVideoElement>(null);
  const audioRef                      = useRef<HTMLAudioElement>(null);

  /* ── data refresh ── */
  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/tv-data', { cache: 'no-store' });
      if (!res.ok) return;
      const d = await res.json();
      if (d.currencies?.length) setCurrencies(d.currencies);
      if (d.gold?.length)       setGold(d.gold);
      if (d.spot)               setSpot(d.spot);
      if (d.tgju)               setTgju(d.tgju);
      if (d.spot?.priceUsd) {
        setPriceHistory(h => {
          const next = [...h, { t: Date.now(), p: d.spot.priceUsd }];
          return next.slice(-80); // ~40 min of history
        });
      }
      setLastUpdated(new Date());
      setPulse(true);
      setTimeout(() => setPulse(false), 800);
    } catch { /* keep data */ }
  }, []);

  useEffect(() => { const id = setInterval(refresh, 30_000); return () => clearInterval(id); }, [refresh]);

  /* full page reload every 6 hours */
  useEffect(() => {
    const id = setTimeout(() => window.location.reload(), 6 * 60 * 60 * 1_000);
    return () => clearTimeout(id);
  }, []);

  /* refresh when tab becomes visible */
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refresh]);

  /* seed chart with initial spot price */
  useEffect(() => {
    if (initialSpot?.priceUsd) {
      setPriceHistory([{ t: Date.now(), p: initialSpot.priceUsd }]);
    }
  }, [initialSpot]);

  /* cycle local videos */
  const handleVideoEnded = useCallback(() => {
    setVideoIdx(i => (i + 1) % LOCAL_VIDEOS.length);
  }, []);

  /* auto-play music if previously started */
  useEffect(() => {
    if (localStorage.getItem('tvMusicStarted') === '1') {
      audioRef.current?.play().then(() => {
        setMusicOn(true);
        setShowTapOverlay(false);
      }).catch(() => { /* keep overlay */ });
    }
  }, []);

  const unlockAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || musicOn) return;
    audio.play().then(() => {
      setMusicOn(true);
      setShowTapOverlay(false);
      localStorage.setItem('tvMusicStarted', '1');
    }).catch(() => { /* stay on overlay */ });
  }, [musicOn]);

  const toggleMusic = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (musicOn) { audio.pause(); setMusicOn(false); } else { unlockAudio(); }
  }, [musicOn, unlockAudio]);

  /* language toggle every 8s */
  useEffect(() => {
    const id = setInterval(() => {
      setLangVisible(false);
      setTimeout(() => { setLang(l => l === 'en' ? 'fa' : 'en'); setLangVisible(true); }, 500);
    }, 8_000);
    return () => clearInterval(id);
  }, []);

  const rows = currencies
    .filter(c => ['USD', 'EUR', 'GBP'].includes(c.code))
    .sort((a, b) => ['USD', 'EUR', 'GBP'].indexOf(a.code) - ['USD', 'EUR', 'GBP'].indexOf(b.code));

  const TROY_OZ_GRAMS = 31.1035;
  const gold18Cad = spot
    ? Math.round(spot.priceCad / TROY_OZ_GRAMS * (18 / 24) * 100) / 100
    : gold.find(g => g.karat === 18)?.pricePerGram ?? null;

  const isFa = lang === 'fa';
  const BUY_LABEL  = isFa ? 'خرید' : 'BUY';
  const SELL_LABEL = isFa ? 'فروش' : 'SELL';

  const rising = priceHistory.length >= 2
    ? priceHistory[priceHistory.length - 1]!.p >= priceHistory[0]!.p
    : true;

  return (
    <div style={{
      width: '100vw', height: '100vh', overflow: 'hidden',
      background: 'linear-gradient(135deg, #080f20 0%, #0d1a35 50%, #091428 100%)',
      color: '#fff',
      fontFamily: isFa ? '"Vazirmatn","Tahoma","Arial",sans-serif' : '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      direction: isFa ? 'rtl' : 'ltr',
      display: 'flex', flexDirection: 'column',
      transition: 'opacity 0.5s', opacity: langVisible ? 1 : 0,
      position: 'relative', zIndex: 1,
    }}>

      {/* background music */}
      <audio ref={audioRef} src="/music.mp4" loop preload="auto" />

      {/* decorative blobs */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10vw', left: '-5vw', width: '40vw', height: '40vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(29,78,216,0.15) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-8vw', right: '-5vw', width: '35vw', height: '35vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,151,42,0.10) 0%, transparent 70%)' }} />
      </div>

      {/* ── HEADER ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1vw 2vw',
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(100,140,220,0.2)',
        flexShrink: 0, zIndex: 1, position: 'relative',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1vw' }}>
          <div style={{ width: '3.5vw', height: '3.5vw', borderRadius: '50%', background: 'linear-gradient(135deg,#C8972A,#E8B84B)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8vw', fontWeight: 900, color: '#0d1a35', boxShadow: '0 0 2vw rgba(200,151,42,0.5)' }}>M</div>
          <div>
            <div style={{ fontSize: '2vw', fontWeight: 900, letterSpacing: isFa ? '0' : '0.06em', color: '#fff' }}>{isFa ? 'صرافی ملی' : 'MELLI EXCHANGE'}</div>
            <div style={{ fontSize: '0.8vw', color: '#C8972A', letterSpacing: isFa ? '0' : '0.15em', marginTop: '0.1vw' }}>{isFa ? 'کوکیتلام، بریتیش کلمبیا · ارز · طلا' : 'CURRENCY · GOLD · COQUITLAM BC'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2vw' }}>
          <button onClick={toggleMusic} style={{ background: musicOn ? 'rgba(200,151,42,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${musicOn ? 'rgba(200,151,42,0.5)' : 'rgba(100,140,220,0.2)'}`, borderRadius: '50%', width: '2.8vw', height: '2.8vw', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.2vw', transition: 'all 0.3s', flexShrink: 0 }}>
            {musicOn ? '🎵' : '🔇'}
          </button>
          <Clock lang={lang} />
        </div>
      </div>

      {/* ── BODY: 3 columns ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', zIndex: 1 }}>

        {/* ── COL 1: Currency rates ── */}
        <div style={{ width: '38%', display: 'flex', flexDirection: 'column', padding: '1.2vw 1.5vw', gap: '1vw', borderRight: '1px solid rgba(100,140,220,0.12)' }}>

          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '0.5vw 1.2vw', background: 'rgba(255,255,255,0.04)', borderRadius: '0.6vw', border: '1px solid rgba(100,140,220,0.15)' }}>
            <div style={{ fontSize: '0.95vw', color: '#7a8eaf', fontWeight: 700, letterSpacing: isFa ? 0 : '0.1em' }}>{isFa ? 'ارز' : 'CURRENCY'}</div>
            <div style={{ fontSize: '0.95vw', color: '#4ade80', fontWeight: 700, textAlign: 'center' }}>{BUY_LABEL}</div>
            <div style={{ fontSize: '0.95vw', color: '#f59e0b', fontWeight: 700, textAlign: 'center' }}>{SELL_LABEL}</div>
          </div>

          {/* Currency rows */}
          {rows.map((c, i) => (
            <div key={c.code} style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
              padding: '1.2vw 1.2vw',
              background: 'linear-gradient(90deg,rgba(29,58,130,0.25) 0%,rgba(15,30,70,0.15) 100%)',
              borderRadius: '0.8vw', border: '1px solid rgba(100,140,220,0.12)',
              boxShadow: '0 0.3vw 1.5vw rgba(0,0,0,0.3)',
              animation: `slideIn 0.6s ease ${i * 0.1}s both`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1vw' }}>
                <span style={{ fontSize: '4vw', lineHeight: 1 }}>{toFlagEmoji(c.flag)}</span>
                <div style={{ fontSize: '0.9vw', color: '#7a8eaf' }}>{isFa ? CURRENCY_FA[c.code] ?? c.name : c.name}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '2.2vw', fontWeight: 800, color: '#4ade80', fontVariantNumeric: 'tabular-nums', textShadow: '0 0 1.5vw rgba(74,222,128,0.4)' }}>
                  <AnimNum value={Math.min(c.buy, c.sell)} fmt={fmtBuy} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '2.2vw', fontWeight: 800, color: '#f59e0b', fontVariantNumeric: 'tabular-nums', textShadow: '0 0 1.5vw rgba(245,158,11,0.4)' }}>
                  <AnimNum value={Math.max(c.buy, c.sell)} fmt={fmtSell} />
                </div>
              </div>
            </div>
          ))}

          {/* Last updated */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5vw', marginTop: 'auto', padding: '0.3vw' }}>
            <div style={{ width: '0.55vw', height: '0.55vw', borderRadius: '50%', background: pulse ? '#4ade80' : '#1d4a2a', boxShadow: pulse ? '0 0 0.6vw #4ade80' : 'none', transition: 'all 0.4s' }} />
            <div style={{ fontSize: '0.7vw', color: '#3a4a6a' }}>
              {isFa ? 'آخرین به‌روزرسانی:' : 'Updated:'}{' '}
              {lastUpdated.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>
        </div>

        {/* ── COL 2: Gold prices + chart ── */}
        <div style={{ width: '32%', display: 'flex', flexDirection: 'column', padding: '1.2vw 1.2vw', gap: '1vw', borderRight: '1px solid rgba(100,140,220,0.12)' }}>

          {/* Gold spot international */}
          {spot && (
            <div style={{ padding: '1.2vw', background: 'linear-gradient(135deg,rgba(120,80,10,0.4) 0%,rgba(80,50,5,0.25) 100%)', borderRadius: '0.8vw', border: '1px solid rgba(200,151,42,0.45)', boxShadow: '0 0 2vw rgba(200,151,42,0.2)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75vw', color: '#a07830', letterSpacing: '0.12em', fontWeight: 700, marginBottom: '0.4vw' }}>
                {isFa ? '🥇 قیمت اونس طلا جهانی' : '🥇 GOLD SPOT (USD/oz)'}
              </div>
              <div style={{ fontSize: '3.2vw', fontWeight: 900, color: '#E8B84B', fontVariantNumeric: 'tabular-nums', textShadow: '0 0 2vw rgba(232,184,75,0.7)', lineHeight: 1 }}>
                $<AnimNum value={spot.priceUsd} fmt={fmtGold} />
              </div>
              <div style={{ fontSize: '0.7vw', color: '#7a8eaf', marginTop: '0.3vw' }}>
                {isFa ? `طلا ۱۸ عیار (کانادا): $${gold18Cad?.toFixed(2) ?? '—'}/g` : `18K Canada: $${gold18Cad?.toFixed(2) ?? '—'}/g`}
              </div>
            </div>
          )}

          {/* Sparkline chart */}
          <div style={{ padding: '0.8vw', background: 'rgba(255,255,255,0.03)', borderRadius: '0.8vw', border: '1px solid rgba(100,140,220,0.15)' }}>
            <div style={{ fontSize: '0.7vw', color: '#7a8eaf', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '0.4vw', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{isFa ? 'نمودار قیمت طلا (Kitco)' : 'GOLD PRICE CHART (Kitco)'}</span>
              <span style={{ color: rising ? '#4ade80' : '#f87171', fontSize: '0.8vw' }}>{rising ? '▲' : '▼'}</span>
            </div>
            <div style={{ height: '6vw' }}>
              <GoldSparkline history={priceHistory} />
            </div>
          </div>

          {/* Iranian gold prices from tgju.org */}
          <div style={{ padding: '0.8vw 1vw', background: 'rgba(255,255,255,0.03)', borderRadius: '0.8vw', border: '1px solid rgba(100,140,220,0.15)', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.6vw' }}>
            <div style={{ fontSize: '0.75vw', color: '#7a8eaf', fontWeight: 700, letterSpacing: '0.08em', paddingBottom: '0.4vw', borderBottom: '1px solid rgba(100,140,220,0.12)' }}>
              {isFa ? 'قیمت بازار ایران (تهران)' : 'IRAN MARKET PRICES'}
              <span style={{ fontSize: '0.6vw', color: '#3a4a6a', marginInlineStart: '0.5vw' }}>tgju.org</span>
            </div>
            {([
              { label: isFa ? 'طلا ۱۸ عیار' : '18K Gold', value: tgju.geram18, unit: isFa ? 'تومان' : 'Toman', color: '#E8B84B' },
              { label: isFa ? 'مثقال طلا' : 'Gold Mithqal', value: tgju.mithqal, unit: isFa ? 'تومان' : 'Toman', color: '#fbbf24' },
              { label: isFa ? 'انس طلا' : 'Gold Ounce',  value: tgju.ons,     unit: isFa ? 'تومان' : 'Toman', color: '#f59e0b' },
              { label: isFa ? 'شاخص بورس' : 'TEDPIX',     value: tgju.tedpix,  unit: '',                         color: '#60a5fa' },
            ] as { label: string; value: string | null; unit: string; color: string }[]).map(row => (
              <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5vw 0.5vw', background: 'rgba(255,255,255,0.02)', borderRadius: '0.4vw' }}>
                <span style={{ fontSize: '0.85vw', color: '#7a8eaf', fontWeight: 600 }}>{row.label}</span>
                <div style={{ textAlign: 'end' }}>
                  <span style={{ fontSize: '1.1vw', fontWeight: 800, color: row.color, fontVariantNumeric: 'tabular-nums' }}>
                    {row.value ?? '—'}
                  </span>
                  {row.unit && <span style={{ fontSize: '0.65vw', color: '#5a6a8a', marginInlineStart: '0.3vw' }}>{row.unit}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── COL 3: Video + promo ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.2)', padding: '1.2vw', gap: '1vw' }}>
          <div style={{ flex: 1, borderRadius: '1vw', overflow: 'hidden', border: '1px solid rgba(100,140,220,0.2)', background: '#04080f', position: 'relative' }}>
            <video ref={videoRef} key={LOCAL_VIDEOS[videoIdx]} src={LOCAL_VIDEOS[videoIdx]} autoPlay muted playsInline onEnded={handleVideoEnded} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, borderRadius: '1vw', pointerEvents: 'none', boxShadow: 'inset 0 0 2vw rgba(29,78,216,0.15)' }} />
          </div>

          {/* Promo ticker */}
          <div style={{ overflow: 'hidden', padding: '0.8vw 0', background: 'linear-gradient(90deg,rgba(29,58,130,0.3) 0%,rgba(15,30,70,0.2) 100%)', borderRadius: '0.6vw', border: '1px solid rgba(100,140,220,0.2)', direction: 'rtl' }}>
            <div style={{ whiteSpace: 'nowrap', fontSize: '1vw', fontWeight: 700, color: '#E8B84B', animation: 'ticker 20s linear infinite', paddingLeft: '100%', textShadow: '0 0 1vw rgba(232,184,75,0.4)' }}>
              {'🌟 خوش آمدید 🌟   ·   🔧 تعمیرات تخصصی طلا و جواهر   ·   💰 قیمت‌های منصفانه به قیمت ایران   ·   ✨ تعمیرات حرفه‌ای با کیفیت تضمین‌شده   ·   🌟 خوش آمدید 🌟   ·   🔧 تعمیرات تخصصی طلا و جواهر   ·   💰 قیمت‌های منصفانه به قیمت ایران   ·   ✨ تعمیرات حرفه‌ای با کیفیت تضمین‌شده'}
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER ticker ── */}
      <div style={{ flexShrink: 0, overflow: 'hidden', height: '2.5vw', background: 'rgba(29,58,130,0.25)', borderTop: '1px solid rgba(100,140,220,0.2)', display: 'flex', alignItems: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ whiteSpace: 'nowrap', fontSize: '0.9vw', color: '#7a8eaf', animation: 'ticker 25s linear infinite', paddingLeft: '100%' }}>
          {'🌟 خوش آمدید 🌟   ·   🔧 تعمیرات تخصصی طلا و جواهر   ·   💰 قیمت‌های منصفانه به قیمت ایران   ·   ✨ تعمیرات حرفه‌ای با کیفیت تضمین‌شده   ·   🌟 خوش آمدید 🌟   ·   🔧 تعمیرات تخصصی طلا و جواهر   ·   💰 قیمت‌های منصفانه به قیمت ایران   ·   ✨ تعمیرات حرفه‌ای با کیفیت تضمین‌شده'}
        </div>
      </div>

      {/* ── Tap-to-start overlay ── */}
      {showTapOverlay && (
        <div onClick={unlockAudio} style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', cursor: 'pointer', animation: 'tapPulse 2.5s ease-in-out infinite' }}>
          <div style={{ fontSize: '8vw', lineHeight: 1 }}>🎵</div>
          <div style={{ fontSize: '3.5vw', fontWeight: 900, color: '#E8B84B', marginTop: '1.5vw', textShadow: '0 0 2vw rgba(232,184,75,0.8)' }}>Tap anywhere to start music</div>
          <div style={{ fontSize: '2vw', color: '#7a8eaf', marginTop: '0.8vw' }}>برای شروع موسیقی لمس کنید</div>
        </div>
      )}

      <style>{`
        @keyframes ticker  { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes slideIn { from { opacity:0; transform:translateY(1vw); } to { opacity:1; transform:translateY(0); } }
        @keyframes tapPulse { 0%,100% { opacity:1; } 50% { opacity:0.65; } }
      `}</style>
    </div>
  );
}
