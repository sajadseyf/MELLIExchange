import bcrypt from 'bcryptjs';
import { connectDb } from './db.js';
import { env } from './env.js';
import { AdminModel } from './models/Admin.js';
import { CurrencyModel } from './models/Currency.js';
import { GoldPriceModel } from './models/GoldPrice.js';
import mongoose from 'mongoose';

const seedCurrencies = [
  { code: 'USD', name: 'US Dollar',        symbol: '$',  flag: '🇺🇸', buy: 1.36, sell: 1.40, order: 1 },
  { code: 'EUR', name: 'Euro',             symbol: '€',  flag: '🇪🇺', buy: 1.46, sell: 1.50, order: 2 },
  { code: 'GBP', name: 'British Pound',    symbol: '£',  flag: '🇬🇧', buy: 1.72, sell: 1.78, order: 3 },
  { code: 'AUD', name: 'Australian Dollar',symbol: 'A$', flag: '🇦🇺', buy: 0.89, sell: 0.93, order: 4 },
  { code: 'JPY', name: 'Japanese Yen',     symbol: '¥',  flag: '🇯🇵', buy: 0.0088, sell: 0.0094, order: 5 },
  { code: 'CNY', name: 'Chinese Yuan',     symbol: '¥',  flag: '🇨🇳', buy: 0.18, sell: 0.20, order: 6 },
  { code: 'AED', name: 'UAE Dirham',       symbol: 'د.إ',flag: '🇦🇪', buy: 0.36, sell: 0.39, order: 7 },
  { code: 'INR', name: 'Indian Rupee',     symbol: '₹',  flag: '🇮🇳', buy: 0.015, sell: 0.018, order: 8 },
  { code: 'IRR', name: 'Iranian Rial',     symbol: '﷼',  flag: '🇮🇷', buy: 0.000022, sell: 0.000028, order: 9 },
  { code: 'TRY', name: 'Turkish Lira',     symbol: '₺',  flag: '🇹🇷', buy: 0.038, sell: 0.043, order: 10 },
  { code: 'MXN', name: 'Mexican Peso',     symbol: '$',  flag: '🇲🇽', buy: 0.066, sell: 0.072, order: 11 },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$',flag: '🇭🇰', buy: 0.17, sell: 0.19, order: 12 },
  { code: 'CHF', name: 'Swiss Franc',      symbol: 'CHF',flag: '🇨🇭', buy: 1.52, sell: 1.58, order: 13 },
  { code: 'SAR', name: 'Saudi Riyal',      symbol: '﷼',  flag: '🇸🇦', buy: 0.36, sell: 0.39, order: 14 },
];

const seedGold = [
  { karat: 18, pricePerGram: 78.0 },
  { karat: 22, pricePerGram: 95.0 },
  { karat: 24, pricePerGram: 104.0 },
];

async function main() {
  await connectDb();

  const existingAdmin = await AdminModel.findOne({ email: env.adminEmail.toLowerCase() });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(env.adminPassword, 10);
    await AdminModel.create({ email: env.adminEmail.toLowerCase(), passwordHash });
    console.log(`[seed] admin created: ${env.adminEmail}`);
  } else {
    console.log(`[seed] admin already exists: ${env.adminEmail}`);
  }

  for (const c of seedCurrencies) {
    await CurrencyModel.updateOne({ code: c.code }, { $setOnInsert: c }, { upsert: true });
  }
  console.log(`[seed] currencies ensured: ${seedCurrencies.length}`);

  for (const g of seedGold) {
    await GoldPriceModel.updateOne({ karat: g.karat }, { $setOnInsert: g }, { upsert: true });
  }
  console.log(`[seed] gold prices ensured: ${seedGold.length}`);

  await mongoose.disconnect();
  console.log('[seed] done');
}

main().catch((err) => {
  console.error('[seed] failed', err);
  process.exit(1);
});
