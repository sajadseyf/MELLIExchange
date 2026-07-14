// Run: node scripts/update-gold.mjs
// Updates gold prices based on current spot price from Yahoo Finance

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env.production') });

const TROY_OZ_GRAMS = 31.1035;

const goldSchema = new mongoose.Schema({ karat: Number, pricePerGram: Number }, { timestamps: true });
const GoldPrice = mongoose.models.GoldPrice ?? mongoose.model('GoldPrice', goldSchema, 'goldprices');

async function fetchGoldUSD() {
  const res = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&range=2d', {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  const d = await res.json();
  const price = d?.chart?.result?.[0]?.meta?.regularMarketPrice;
  if (!price) throw new Error('Could not fetch gold price from Yahoo');
  return price;
}

async function fetchUsdCad() {
  const res = await fetch('https://open.er-api.com/v6/latest/USD');
  const d = await res.json();
  return d?.rates?.CAD ?? 1.4241;
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI, { dbName: 'melli_exchange' });
  console.log('Connected to MongoDB');

  const [goldUSD, usdCad] = await Promise.all([fetchGoldUSD(), fetchUsdCad()]);
  console.log(`Gold spot: $${goldUSD.toFixed(2)} USD/oz`);
  console.log(`USD/CAD: ${usdCad.toFixed(4)}`);

  const cadPerOz = goldUSD * usdCad;
  const karats = [10, 14, 18, 22, 24];

  for (const karat of karats) {
    const pricePerGram = Math.round((cadPerOz / TROY_OZ_GRAMS) * (karat / 24) * 100) / 100;
    await GoldPrice.findOneAndUpdate({ karat }, { $set: { pricePerGram } }, { upsert: true, new: true });
    console.log(`${karat}k → CA$${pricePerGram}/gram`);
  }

  console.log('Done ✓');
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e.message); process.exit(1); });
