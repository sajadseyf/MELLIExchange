import { getCurrencies, getGoldPrices, getGoldSpotPrice } from '@/lib/api';
import TVDisplay from './TVDisplay';

export const revalidate = 30;

export default async function TVPage() {
  const [currencies, gold, spot] = await Promise.all([
    getCurrencies(),
    getGoldPrices(),
    getGoldSpotPrice(),
  ]);

  return <TVDisplay initialCurrencies={currencies} initialGold={gold} initialSpot={spot} />;
}
