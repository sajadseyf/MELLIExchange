'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

interface Currency { code: string; name: string; flag: string; buy: number; sell: number; }
interface GoldPrice { karat: number; pricePerGram: number; }
interface SpotPrice  { priceUsd: number; priceCad: number; }

const CURRENCY_FA: Record<string, string> = { USD: 'دلار آمریکا', EUR: 'یورو', GBP: 'پوند انگلیس' };

function toFlagEmoji(code: string): string {
  return code.toUpperCase().replace(/./g, c =>
    String.fromCodePoint(0x1F1E6 - 65 + c.charCodeAt(0))
  );
}

function fmt(n: number)     { return n.toLocaleString('en-CA', { minimumFractionDigits: 4, maximumFractionDigits: 4 }); }
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
      <div style={{ fontSize: '2.6vw', fontWeight: 800, color: '#fff', letterSpacing: '0.06em', fontVariantNumeric: 'tabular-nums' }}>{t}</div>
      <div style={{ fontSize: '1vw', color: '#7a8eaf', marginTop: '0.2vw' }}>{d}</div>
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

// ── YouTube ambient music player ──────────────────────────────────────────────
// Paste your YouTube video ID here (the part after ?v= or youtu.be/)
// e.g. for https://www.youtube.com/watch?v=jfKfPfyJRdk → 'jfKfPfyJRdk'
const YOUTUBE_VIDEO_ID = '9UMxZofMNbA';

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
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [pulse, setPulse]             = useState(false);
  const [lang, setLang]               = useState<'en' | 'fa'>('en');
  const [langVisible, setLangVisible] = useState(true);
  const [videoIdx, setVideoIdx]       = useState(0);
  const [musicOn, setMusicOn]         = useState(false);
  const videoRef                      = useRef<HTMLVideoElement>(null);
  const iframeRef                     = useRef<HTMLIFrameElement>(null);

  /* ── data refresh ── */
  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/tv-data', { cache: 'no-store' });
      if (!res.ok) return;
      const d = await res.json();
      if (d.currencies?.length) setCurrencies(d.currencies);
      if (d.gold?.length)       setGold(d.gold);
      if (d.spot)               setSpot(d.spot);
      setLastUpdated(new Date());
      setPulse(true);
      setTimeout(() => setPulse(false), 800);
    } catch { /* keep data */ }
  }, []);

  useEffect(() => { const id = setInterval(refresh, 30_000); return () => clearInterval(id); }, [refresh]);

  /* refresh immediately when tab becomes visible again */
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refresh]);

  /* ── cycle local videos on ended (fallback when no YOUTUBE_VIDEO_ID) ── */
  const handleVideoEnded = useCallback(() => {
    setVideoIdx(i => (i + 1) % LOCAL_VIDEOS.length);
  }, []);

  /* ── toggle YouTube background music via postMessage ── */
  const toggleMusic = useCallback(() => {
    const func = musicOn ? 'mute' : 'unMute';
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func, args: [] }),
      '*',
    );
    setMusicOn(m => !m);
  }, [musicOn]);

  /* ── language toggle every 8s with fade ── */
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

  // Compute 18K price from live Kitco spot — same formula everywhere
  const TROY_OZ_GRAMS = 31.1035;
  const gold18PricePerGram = spot
    ? Math.round(spot.priceCad / TROY_OZ_GRAMS * (18 / 24) * 100) / 100
    : gold.find(g => g.karat === 18)?.pricePerGram ?? null;
  const isFa   = lang === 'fa';

  const BUY_LABEL  = isFa ? 'خرید' : 'BUY';
  const SELL_LABEL = isFa ? 'فروش' : 'SELL';

  return (
    <div style={{
      width: '100vw', height: '100vh', overflow: 'hidden',
      background: 'linear-gradient(135deg, #080f20 0%, #0d1a35 50%, #091428 100%)',
      color: '#fff',
      fontFamily: isFa
        ? '"Vazirmatn", "Tahoma", "Arial", sans-serif'
        : '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      direction: isFa ? 'rtl' : 'ltr',
      display: 'flex', flexDirection: 'column',
      transition: 'opacity 0.5s',
      opacity: langVisible ? 1 : 0,
    }}>

      {/* ── decorative blobs ── */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10vw', left: '-5vw', width: '40vw', height: '40vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(29,78,216,0.15) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-8vw', right: '-5vw', width: '35vw', height: '35vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,151,42,0.10) 0%, transparent 70%)' }} />
      </div>

      {/* ── Hidden YouTube audio player (1px — browser keeps it alive) ── */}
      {YOUTUBE_VIDEO_ID && (
        <iframe
          ref={iframeRef}
          src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&mute=1&enablejsapi=1&controls=0&disablekb=1&loop=1&playlist=${YOUTUBE_VIDEO_ID}`}
          allow="autoplay; encrypted-media"
          style={{ position: 'fixed', width: '1px', height: '1px', bottom: 0, left: 0, border: 'none', pointerEvents: 'none' }}
          aria-hidden="true"
        />
      )}

      {/* ── HEADER ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1.2vw 2.5vw',
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(100,140,220,0.2)',
        flexShrink: 0, zIndex: 1, position: 'relative',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2vw' }}>
          <div style={{
            width: '4vw', height: '4vw', borderRadius: '50%',
            background: 'linear-gradient(135deg, #C8972A, #E8B84B)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2vw', fontWeight: 900, color: '#0d1a35',
            boxShadow: '0 0 2vw rgba(200,151,42,0.5), 0 0 4vw rgba(200,151,42,0.2)',
          }}>M</div>
          <div>
            <div style={{ fontSize: '2.2vw', fontWeight: 900, letterSpacing: isFa ? '0' : '0.06em', color: '#fff' }}>
              {isFa ? 'صرافی ملی' : 'MELLI EXCHANGE'}
            </div>
            <div style={{ fontSize: '0.9vw', color: '#C8972A', letterSpacing: isFa ? '0' : '0.18em', marginTop: '0.1vw' }}>
              {isFa ? 'کوکیتلام، بریتیش کلمبیا · ارز · طلا' : 'CURRENCY · GOLD · COQUITLAM BC'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2vw' }}>
          {/* Music toggle button — hidden YouTube iframe plays in background */}
          {YOUTUBE_VIDEO_ID && (
            <button
              onClick={toggleMusic}
              title={musicOn ? 'Mute music' : 'Play background music'}
              style={{
                background: musicOn ? 'rgba(200,151,42,0.15)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${musicOn ? 'rgba(200,151,42,0.5)' : 'rgba(100,140,220,0.2)'}`,
                borderRadius: '50%',
                width: '3vw', height: '3vw',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1.3vw',
                transition: 'all 0.3s',
                flexShrink: 0,
              }}
            >
              {musicOn ? '🎵' : '🔇'}
            </button>
          )}
          <Clock lang={lang} />
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', zIndex: 1 }}>

        {/* ── LEFT: currencies + gold ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1.5vw 2.5vw', gap: '1.5vw' }}>

          {/* Column headers */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            padding: '0.6vw 1.5vw',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: '0.8vw',
            border: '1px solid rgba(100,140,220,0.15)',
          }}>
            <div style={{ fontSize: '1.1vw', color: '#7a8eaf', fontWeight: 700, letterSpacing: isFa ? 0 : '0.12em' }}>
              {isFa ? 'ارز' : 'CURRENCY'}
            </div>
            <div style={{ fontSize: '1.1vw', color: '#4ade80', fontWeight: 700, textAlign: 'center', letterSpacing: isFa ? 0 : '0.12em' }}>
              {BUY_LABEL}
            </div>
            <div style={{ fontSize: '1.1vw', color: '#f59e0b', fontWeight: 700, textAlign: 'center', letterSpacing: isFa ? 0 : '0.12em' }}>
              {SELL_LABEL}
            </div>
          </div>

          {/* Currency rows */}
          {rows.map((c, i) => (
            <div key={c.code} style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
              padding: '1.4vw 1.5vw',
              background: 'linear-gradient(90deg, rgba(29,58,130,0.25) 0%, rgba(15,30,70,0.15) 100%)',
              borderRadius: '1vw',
              border: '1px solid rgba(100,140,220,0.12)',
              boxShadow: '0 0.3vw 1.5vw rgba(0,0,0,0.3)',
              backdropFilter: 'blur(4px)',
              animation: `slideIn 0.6s ease ${i * 0.1}s both`,
            }}>
              {/* Currency info — flag only */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5vw' }}>
                <span style={{ fontSize: '5vw', lineHeight: 1, filter: 'drop-shadow(0 0 0.5vw rgba(255,255,255,0.15))' }}>{toFlagEmoji(c.flag)}</span>
                <div style={{ fontSize: '1.1vw', color: '#7a8eaf' }}>
                  {isFa ? CURRENCY_FA[c.code] ?? c.name : c.name}
                </div>
              </div>
              {/* Buy — always the lower rate */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                  fontSize: '2.6vw', fontWeight: 800, color: '#4ade80',
                  fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em',
                  textShadow: '0 0 2vw rgba(74,222,128,0.4)',
                }}>
                  <AnimNum value={Math.min(c.buy, c.sell)} fmt={fmt} />
                </div>
              </div>
              {/* Sell — always the higher rate */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                  fontSize: '2.6vw', fontWeight: 800, color: '#f59e0b',
                  fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em',
                  textShadow: '0 0 2vw rgba(245,158,11,0.4)',
                }}>
                  <AnimNum value={Math.max(c.buy, c.sell)} fmt={fmt} />
                </div>
              </div>
            </div>
          ))}

          {/* ── 18K Gold bar ── */}
          {gold18PricePerGram !== null && (
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
              padding: '1.4vw 1.5vw',
              background: 'linear-gradient(90deg, rgba(120,80,10,0.35) 0%, rgba(80,50,5,0.2) 100%)',
              borderRadius: '1vw',
              border: '1px solid rgba(200,151,42,0.35)',
              boxShadow: '0 0 2vw rgba(200,151,42,0.15), 0 0.3vw 1.5vw rgba(0,0,0,0.3)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1vw' }}>
                <div style={{
                  width: '3.5vw', height: '3.5vw', borderRadius: '0.6vw',
                  background: 'linear-gradient(135deg, #C8972A, #E8B84B, #C8972A)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.1vw', fontWeight: 900, color: '#1a0f00',
                  boxShadow: '0 0 1vw rgba(200,151,42,0.5)',
                  flexShrink: 0,
                }}>
                  18K
                </div>
                <div>
                  <div style={{ fontSize: '1.8vw', fontWeight: 800, color: '#E8B84B', lineHeight: 1.1 }}>
                    {isFa ? '۱۸ عیار' : '18K GOLD'}
                  </div>
                  <div style={{ fontSize: '1vw', color: '#a07830', marginTop: '0.2vw' }}>
                    {isFa ? 'طلای ۷۵٪ · قیمت هر گرم' : '75% purity · per gram'}
                  </div>
                </div>
              </div>
              <div />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: '2.8vw', fontWeight: 900, color: '#E8B84B',
                    fontVariantNumeric: 'tabular-nums',
                    textShadow: '0 0 2vw rgba(232,184,75,0.6)',
                  }}>
                    $<AnimNum value={gold18PricePerGram!} fmt={fmtGold} />
                  </div>
                  <div style={{ fontSize: '0.9vw', color: '#a07830', marginTop: '0.2vw' }}>
                    {isFa ? 'دلار کانادا / گرم' : 'CAD / gram'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: video + spot ── */}
        <div style={{
          width: '30vw', flexShrink: 0,
          display: 'flex', flexDirection: 'column',
          borderLeft: '1px solid rgba(100,140,220,0.15)',
          background: 'rgba(0,0,0,0.2)',
          padding: '1.5vw',
          gap: '1.5vw',
        }}>

          {/* Video / YouTube player */}
          <div style={{
            flex: 1,
            borderRadius: '1vw',
            overflow: 'hidden',
            border: '1px solid rgba(100,140,220,0.2)',
            background: '#04080f',
            position: 'relative',
          }}>
            <video
              ref={videoRef}
              key={LOCAL_VIDEOS[videoIdx]}
              src={LOCAL_VIDEOS[videoIdx]}
              autoPlay muted playsInline
              onEnded={handleVideoEnded}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '1vw', pointerEvents: 'none',
              boxShadow: 'inset 0 0 2vw rgba(29,78,216,0.15)',
            }} />
          </div>

          {/* Gold spot */}
          {spot && (
            <div style={{
              padding: '1.2vw',
              background: 'linear-gradient(135deg, rgba(120,80,10,0.2), rgba(80,50,5,0.1))',
              borderRadius: '0.8vw',
              border: '1px solid rgba(200,151,42,0.25)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.8vw', color: '#a07830', letterSpacing: '0.15em', marginBottom: '0.4vw' }}>
                {isFa ? 'قیمت جهانی طلا (USD/oz)' : 'WORLD GOLD PRICE (USD/oz)'}
              </div>
              <div style={{
                fontSize: '2.2vw', fontWeight: 900, color: '#E8B84B',
                fontVariantNumeric: 'tabular-nums',
                textShadow: '0 0 1.5vw rgba(232,184,75,0.5)',
              }}>
                ${spot.priceUsd.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.8vw', color: '#7a8eaf', marginTop: '0.3vw' }}>
                C${spot.priceCad.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CAD
              </div>
            </div>
          )}

          {/* Last updated indicator */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6vw',
            padding: '0.5vw',
          }}>
            <div style={{
              width: '0.7vw', height: '0.7vw', borderRadius: '50%',
              background: pulse ? '#4ade80' : '#1d4a2a',
              boxShadow: pulse ? '0 0 0.8vw #4ade80' : 'none',
              transition: 'all 0.4s',
            }} />
            <div style={{ fontSize: '0.75vw', color: '#3a4a6a' }}>
              {isFa ? 'آخرین به‌روزرسانی:' : 'Updated:'}{' '}
              {lastUpdated.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER ticker ── */}
      <div style={{
        flexShrink: 0, overflow: 'hidden', height: '2.8vw',
        background: 'rgba(29,58,130,0.25)',
        borderTop: '1px solid rgba(100,140,220,0.2)',
        display: 'flex', alignItems: 'center',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{
          whiteSpace: 'nowrap', fontSize: '1vw', color: '#7a8eaf',
          animation: 'ticker 25s linear infinite',
          paddingLeft: '100%',
        }}>
          {'🌟 خوش آمدید 🌟   ·   🔧 تعمیرات تخصصی طلا و جواهر   ·   💰 قیمت‌های منصفانه به قیمت ایران   ·   ✨ تعمیرات حرفه‌ای با کیفیت تضمین‌شده   ·   🌟 خوش آمدید 🌟   ·   🔧 تعمیرات تخصصی طلا و جواهر   ·   💰 قیمت‌های منصفانه به قیمت ایران   ·   ✨ تعمیرات حرفه‌ای با کیفیت تضمین‌شده'}
        </div>
      </div>

      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(1vw); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1);    box-shadow: 0 0 2vw rgba(200,151,42,0.2); }
          50%       { transform: scale(1.08); box-shadow: 0 0 3vw rgba(200,151,42,0.5); }
        }
      `}</style>
    </div>
  );
}
