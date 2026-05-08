'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

interface Props {
  initialUsd: number;
  label: string;
}

export function LiveGoldSpot({ initialUsd, label }: Props) {
  const [price, setPrice] = useState(initialUsd);

  useEffect(() => {
    let active = true;

    async function refresh() {
      try {
        const res = await fetch(`/api/spot/latest`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const p = data?.gold?.priceUsd;
        if (p && p > 1000 && active) setPrice(p);
      } catch { /* ignore */ }
    }

    const id = setInterval(refresh, 60_000);
    return () => { active = false; clearInterval(id); };
  }, []);

  return (
    <span className="text-lg font-bold tabular-nums text-ink-900 dark:text-white">
      ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      <span className="ml-1 text-xs font-normal text-ink-400">{label}</span>
    </span>
  );
}
