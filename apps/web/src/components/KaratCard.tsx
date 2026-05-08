'use client';

import { useState } from 'react';

interface Props {
  k: number;
  purity: number;
  alloy: number;
  color: string;
  label: string;
  pricePerGram?: number;
  purityLabel: string;
  alloyLabel: string;
}

function KaratRing({ purity, color, size = 100 }: { purity: number; color: string; size?: number }) {
  const cx = size / 2, cy = size / 2;
  const r  = size * 0.34;
  const sw = size * 0.20;
  const circ = 2 * Math.PI * r;
  const goldLen  = (purity / 100) * circ;
  const alloyLen = circ - goldLen;
  const id = `g${Math.round(purity * 10)}`;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#d1d5db" strokeWidth={sw}
        strokeDasharray={`${alloyLen} ${goldLen}`}
        strokeDashoffset={-goldLen}
        transform={`rotate(-90 ${cx} ${cy})`} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={`url(#${id})`} strokeWidth={sw}
        strokeDasharray={`${goldLen} ${alloyLen}`}
        transform={`rotate(-90 ${cx} ${cy})`} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={sw - 2} />
    </svg>
  );
}

export function KaratCard({ k, purity, alloy, color, label, pricePerGram, purityLabel, alloyLabel }: Props) {
  const [hovered, setHovered] = useState(false);
  const isPure = k === 24;

  return (
    <div
      className="relative flex flex-col items-center overflow-hidden rounded-2xl bg-white p-5 transition-all duration-300 dark:bg-dark-card"
      style={{
        border: `1px solid ${hovered ? color + '80' : color + '35'}`,
        boxShadow: hovered ? `0 8px 24px ${color}20` : '0 1px 4px rgba(0,0,0,0.06)',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {isPure && (
        <span
          className="absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-black"
          style={{ background: `linear-gradient(135deg, ${color}, #b45309)` }}
        >
          PURE
        </span>
      )}

      {/* Karat badge */}
      <div
        className="mb-3 rounded-xl px-4 py-1.5 text-sm font-black text-black"
        style={{ background: `linear-gradient(135deg, ${color}, #92400e)` }}
      >
        {label}
      </div>

      {/* Ring */}
      <div className="relative mb-3">
        <KaratRing purity={purity} color={color} size={100} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-black" style={{ color }}>{k}K</span>
        </div>
      </div>

      {/* Purity badges */}
      <div className="mb-4 flex flex-wrap justify-center gap-1.5">
        <span
          className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
          style={{ background: `${color}20`, color }}
        >
          {purityLabel} {purity}%
        </span>
        {alloy > 0 && (
          <span className="rounded-full bg-ink-100 px-2.5 py-0.5 text-[11px] text-ink-500 dark:bg-zinc-800 dark:text-zinc-400">
            {alloyLabel} {alloy}%
          </span>
        )}
      </div>

      {/* Price */}
      <div
        className="w-full rounded-xl py-3 text-center"
        style={{ background: `${color}0d`, border: `1px solid ${color}25` }}
      >
        {pricePerGram != null ? (
          <>
            <p className="text-2xl font-black tabular-nums text-ink-900 dark:text-white">
              ${pricePerGram.toFixed(2)}
            </p>
            <p className="text-xs text-ink-400 dark:text-zinc-500">CAD / gram</p>
          </>
        ) : (
          <p className="text-sm text-zinc-600">—</p>
        )}
      </div>
    </div>
  );
}
