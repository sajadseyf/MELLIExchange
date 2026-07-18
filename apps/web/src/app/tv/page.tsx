import dynamic from 'next/dynamic';
import { getCurrencies, getGoldPrices, getGoldSpotPrice } from '@/lib/api';

// No SSR — TVDisplay uses Date/clock state that would cause hydration mismatch
const TVDisplay = dynamic(() => import('./TVDisplay'), { ssr: false });

export const revalidate = 30;

export default async function TVPage() {
  const [currencies, gold, spot] = await Promise.all([
    getCurrencies(),
    getGoldPrices(),
    getGoldSpotPrice(),
  ]);

  return <TVDisplay initialCurrencies={currencies} initialGold={gold} initialSpot={spot} />;
}
