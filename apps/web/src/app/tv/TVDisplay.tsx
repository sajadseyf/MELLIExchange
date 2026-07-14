'use client';

import { useEffect, useState, useCallback } from 'react';

interface Currency {
  code: string;
  name: string;
  flag: string;
  buy: number;
  sell: number;
  order: number;
  hidden: boolean;
  contactUs: boolean;
}

interface GoldPrice {
  karat: number;
  pricePerGram: number;
}

interface SpotPrice {
  priceUsd: number;
  priceCad: number;
}

function fmt(n: number) {
  return n.toLocaleString('en-CA', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

function fmtGold(n: number) {
  return n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Clock() {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
      setDate(now.toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="text-right">
      <div style={{ fontSize: '2.8vw', fontWeight: 700, color: '#fff', letterSpacing: '0.05em', fontVariantNumeric: 'tabular-nums' }}>
        {time}
      </div>
      <div style={{ fontSize: '1.1vw', color: '#8b93a7', marginTop: '0.2vw' }}>{date}</div>
    </div>
  );
}

export default function TVDisplay({
  initialCurrencies,
  initialGold,
  initialSpot,
}: {
  initialCurrencies: Currency[];
  initialGold: GoldPrice[];
  initialSpot: SpotPrice | null;
}) {
  const [currencies, setCurrencies] = useState(initialCurrencies);
  const [gold, setGold] = useState(initialGold);
  const [spot, setSpot] = useState(initialSpot);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [pulse, setPulse] = useState(false);

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
    } catch { /* keep existing data */ }
  }, []);

  useEffect(() => {
    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
  }, [refresh]);

  const rows = currencies
    .filter((c) => ['USD', 'EUR', 'GBP'].includes(c.code))
    .sort((a, b) => ['USD', 'EUR', 'GBP'].indexOf(a.code) - ['USD', 'EUR', 'GBP'].indexOf(b.code));

  const goldKarats = [10, 14, 18, 22, 24];
  const goldMap = Object.fromEntries(gold.map((g) => [g.karat, g.pricePerGram]));

  return (
    <div style={{
      width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column',
      background: '#04060f', color: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      overflow: 'hidden',
    }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1.2vw 2vw',
        borderBottom: '1px solid rgba(200,151,42,0.25)',
        background: 'linear-gradient(90deg, rgba(200,151,42,0.08) 0%, transparent 60%)',
        flexShrink: 0,
      }}>
        {/* Logo + Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2vw' }}>
          <div style={{
            width: '3.5vw', height: '3.5vw', borderRadius: '50%',
            background: 'linear-gradient(135deg, #C8972A, #E8B84B)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 2vw rgba(200,151,42,0.4)',
            fontSize: '1.8vw', flexShrink: 0,
          }}>
            M
          </div>
          <div>
            <div style={{ fontSize: '2vw', fontWeight: 800, letterSpacing: '0.02em', color: '#fff' }}>
              MELLI EXCHANGE
            </div>
            <div style={{ fontSize: '0.95vw', color: '#C8972A', letterSpacing: '0.15em', marginTop: '0.1vw' }}>
              CURRENCY · GOLD · COQUITLAM BC
            </div>
          </div>
        </div>

        {/* Spot price + Clock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '3vw' }}>
          {spot && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.9vw', color: '#8b93a7', letterSpacing: '0.1em', marginBottom: '0.2vw' }}>
                GOLD SPOT (USD/oz)
              </div>
              <div style={{ fontSize: '1.8vw', fontWeight: 700, color: '#E8B84B', fontVariantNumeric: 'tabular-nums' }}>
                ${spot.priceUsd.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          )}
          <Clock />
        </div>
      </div>

      {/* ── Body: currencies + gold ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Currency Table ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '3fr 1fr 1fr',
            padding: '0.7vw 2vw',
            background: 'rgba(255,255,255,0.03)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            flexShrink: 0,
          }}>
            <div style={{ fontSize: '1vw', color: '#8b93a7', letterSpacing: '0.12em', fontWeight: 600 }}>CURRENCY</div>
            <div style={{ fontSize: '1vw', color: '#4ade80', letterSpacing: '0.12em', fontWeight: 600, textAlign: 'right' }}>BUY (خرید)</div>
            <div style={{ fontSize: '1vw', color: '#f59e0b', letterSpacing: '0.12em', fontWeight: 600, textAlign: 'right' }}>SELL (فروش)</div>
          </div>

          {/* Rows */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {rows.map((c, i) => (
              <div key={c.code} style={{
                display: 'grid', gridTemplateColumns: '3fr 1fr 1fr',
                padding: `${Math.max(0.5, 5.5 / rows.length)}vw 2vw`,
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                background: i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
                transition: 'background 0.3s',
              }}>
                {/* Currency info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1vw' }}>
                  <span style={{ fontSize: `${Math.min(2.5, 4 / Math.sqrt(rows.length))}vw` }}>{c.flag}</span>
                  <div>
                    <div style={{ fontSize: `${Math.min(1.6, 3 / Math.sqrt(rows.length))}vw`, fontWeight: 700, color: '#fff' }}>
                      {c.code}
                    </div>
                    <div style={{ fontSize: `${Math.min(1, 2 / Math.sqrt(rows.length))}vw`, color: '#8b93a7', marginTop: '0.1vw' }}>
                      {c.name}
                    </div>
                  </div>
                </div>

                {/* Buy */}
                <div style={{
                  textAlign: 'right',
                  fontSize: `${Math.min(1.9, 3.5 / Math.sqrt(rows.length))}vw`,
                  fontWeight: 700,
                  color: '#4ade80',
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '0.02em',
                }}>
                  {fmt(c.buy)}
                </div>

                {/* Sell */}
                <div style={{
                  textAlign: 'right',
                  fontSize: `${Math.min(1.9, 3.5 / Math.sqrt(rows.length))}vw`,
                  fontWeight: 700,
                  color: '#f59e0b',
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '0.02em',
                }}>
                  {fmt(c.sell)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Gold Panel ── */}
        <div style={{
          width: '22vw', flexShrink: 0,
          borderLeft: '1px solid rgba(200,151,42,0.2)',
          background: 'linear-gradient(180deg, rgba(200,151,42,0.06) 0%, rgba(200,151,42,0.02) 100%)',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Gold header */}
          <div style={{
            padding: '1vw 1.5vw',
            borderBottom: '1px solid rgba(200,151,42,0.2)',
            background: 'rgba(200,151,42,0.1)',
          }}>
            <div style={{ fontSize: '1vw', color: '#C8972A', letterSpacing: '0.15em', fontWeight: 700 }}>GOLD PRICES</div>
            <div style={{ fontSize: '0.8vw', color: '#8b93a7', marginTop: '0.2vw' }}>CAD / gram (per karat)</div>
          </div>

          {/* Karat rows */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly', padding: '0.5vw 0' }}>
            {goldKarats.map((k) => {
              const price = goldMap[k];
              const purity = k === 24 ? '99.9%' : k === 22 ? '91.6%' : k === 18 ? '75%' : k === 14 ? '58.5%' : '41.7%';
              return (
                <div key={k} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.8vw 1.5vw',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}>
                  <div>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: '3.2vw', height: '3.2vw', borderRadius: '0.5vw',
                      background: `linear-gradient(135deg, rgba(200,151,42,${0.1 + k/24 * 0.3}), rgba(200,151,42,${0.05 + k/24 * 0.15}))`,
                      border: `1px solid rgba(200,151,42,${0.2 + k/24 * 0.3})`,
                      fontSize: '1.1vw', fontWeight: 800, color: '#E8B84B',
                    }}>
                      {k}K
                    </div>
                    <div style={{ fontSize: '0.75vw', color: '#8b93a7', marginTop: '0.3vw', textAlign: 'center' }}>{purity}</div>
                  </div>
                  <div style={{
                    textAlign: 'right',
                    fontSize: '1.6vw', fontWeight: 800,
                    color: '#E8B84B',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {price ? `$${fmtGold(price)}` : '—'}
                    <div style={{ fontSize: '0.7vw', color: '#8b93a7', fontWeight: 400 }}>CAD/g</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Last updated */}
          <div style={{
            padding: '0.8vw 1.5vw',
            borderTop: '1px solid rgba(200,151,42,0.15)',
            display: 'flex', alignItems: 'center', gap: '0.5vw',
          }}>
            <div style={{
              width: '0.6vw', height: '0.6vw', borderRadius: '50%',
              background: pulse ? '#4ade80' : '#2d6a4f',
              transition: 'background 0.3s',
              boxShadow: pulse ? '0 0 0.5vw #4ade80' : 'none',
            }} />
            <div style={{ fontSize: '0.75vw', color: '#8b93a7' }}>
              Updated {lastUpdated.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{
        padding: '0.5vw 2vw',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexShrink: 0,
        background: 'rgba(0,0,0,0.3)',
      }}>
        <div style={{ fontSize: '0.75vw', color: '#8b93a7' }}>
          Unit 1102 Henderson Place Mall · 1163 Pinetree Way, Coquitlam BC · Tel: (604) 492-3338
        </div>
        <div style={{ fontSize: '0.75vw', color: '#8b93a7' }}>
          FINTRAC Registered · All prices in CAD · Auto-refreshes every 30s
        </div>
      </div>
    </div>
  );
}
