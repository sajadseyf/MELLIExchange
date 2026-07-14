import { getCurrencies, getGoldPrices, getGoldSpotPrice } from '@/lib/api';
import TVDisplay from './TVDisplay';

export const revalidate = 30;

// Place your video file in /public/tv-ad.mp4 and it will play here
const VIDEO_URL = process.env.TV_VIDEO_URL ?? '/tv-ad.mp4';

export default async function TVPage() {
  const [currencies, gold, spot] = await Promise.all([
    getCurrencies(),
    getGoldPrices(),
    getGoldSpotPrice(),
  ]);

  return (
    <TVDisplay
      initialCurrencies={currencies}
      initialGold={gold}
      initialSpot={spot}
      videoUrl={VIDEO_URL}
    />
  );
}
