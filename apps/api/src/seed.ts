import bcrypt from 'bcryptjs';
import { connectDb } from './db.js';
import { env } from './env.js';
import { AdminModel } from './models/Admin.js';
import { CurrencyModel } from './models/Currency.js';
import { GoldPriceModel } from './models/GoldPrice.js';
import { ProductModel } from './models/Product.js';
import { GoldPriceHistoryModel } from './models/GoldPriceHistory.js';
import mongoose from 'mongoose';

const seedCurrencies = [
  { code: 'USD', name: 'US Dollar',         symbol: '$',   flag: 'us', buy: 1.36, sell: 1.40, order: 1 },
  { code: 'EUR', name: 'Euro',              symbol: '€',   flag: 'eu', buy: 1.46, sell: 1.50, order: 2 },
  { code: 'GBP', name: 'British Pound',     symbol: '£',   flag: 'gb', buy: 1.72, sell: 1.78, order: 3 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$',  flag: 'au', buy: 0.89, sell: 0.93, order: 4 },
  { code: 'JPY', name: 'Japanese Yen',      symbol: '¥',   flag: 'jp', buy: 0.0088, sell: 0.0094, order: 5 },
  { code: 'CNY', name: 'Chinese Yuan',      symbol: '¥',   flag: 'cn', buy: 0.18, sell: 0.20, order: 6 },
  { code: 'AED', name: 'UAE Dirham',        symbol: 'د.إ', flag: 'ae', buy: 0.36, sell: 0.39, order: 7 },
  { code: 'INR', name: 'Indian Rupee',      symbol: '₹',   flag: 'in', buy: 0.015, sell: 0.018, order: 8 },
  { code: 'IRR', name: 'Iranian Rial',      symbol: '﷼',   flag: 'ir', buy: 0.000022, sell: 0.000028, order: 9 },
  { code: 'TRY', name: 'Turkish Lira',      symbol: '₺',   flag: 'tr', buy: 0.038, sell: 0.043, order: 10 },
  { code: 'MXN', name: 'Mexican Peso',      symbol: '$',   flag: 'mx', buy: 0.066, sell: 0.072, order: 11 },
  { code: 'HKD', name: 'Hong Kong Dollar',  symbol: 'HK$', flag: 'hk', buy: 0.17, sell: 0.19, order: 12 },
  { code: 'CHF', name: 'Swiss Franc',       symbol: 'CHF', flag: 'ch', buy: 1.52, sell: 1.58, order: 13 },
  { code: 'SAR', name: 'Saudi Riyal',       symbol: '﷼',   flag: 'sa', buy: 0.36, sell: 0.39, order: 14 },
];

const seedGold = [
  { karat: 18, pricePerGram: 78.0 },
  { karat: 22, pricePerGram: 95.0 },
  { karat: 24, pricePerGram: 104.0 },
];

const seedProducts = [
  // ── Rings / انگشتر ──────────────────────────────────────────────────
  {
    name: 'Classic Solitaire Ring',
    description: 'A timeless solitaire band with a polished finish — perfect for everyday elegance or as a wedding band.',
    category: 'ring', karat: 18, weightGrams: 4.5, price: 395, inStock: true, order: 1,
  },
  {
    name: 'Persian Rose Band',
    description: 'Inspired by traditional Persian floral motifs, this band features delicate engraved rose detailing.',
    category: 'ring', karat: 18, weightGrams: 5.2, price: 450, inStock: true, order: 2,
  },
  {
    name: 'Diamond-Cut Eternity Ring',
    description: 'Brilliant diamond-cut facets run the full circumference for maximum sparkle and light reflection.',
    category: 'ring', karat: 21, weightGrams: 6.0, price: 590, inStock: true, order: 3,
  },
  {
    name: 'Scrollwork Signet Ring',
    description: 'Heavy-gauge signet ring with hand-engraved scrollwork on the flat face — a bold statement piece.',
    category: 'ring', karat: 22, weightGrams: 7.5, price: 745, inStock: true, order: 4,
  },
  {
    name: 'Filigree Dome Ring',
    description: 'Intricate filigree wirework shaped into a high dome, crafted in the tradition of Persian goldsmithing.',
    category: 'ring', karat: 18, weightGrams: 5.8, price: 510, inStock: true, order: 5,
  },
  {
    name: 'Twisted Rope Band',
    description: 'Two strands of gold wire twisted together into a seamless rope — elegant, durable, and gender-neutral.',
    category: 'ring', karat: 21, weightGrams: 4.0, price: 390, inStock: true, order: 6,
  },
  {
    name: 'Wide Hammered Band',
    description: 'A wide, flat band with a hand-hammered texture that catches the light beautifully.',
    category: 'ring', karat: 22, weightGrams: 8.0, price: 800, inStock: false, order: 7,
  },
  {
    name: 'Stacking Ring Set (3 pcs)',
    description: 'Three slim bands — plain, twisted, and beaded — designed to be worn together or separately.',
    category: 'ring', karat: 18, weightGrams: 6.0, price: 520, inStock: true, order: 8,
  },
  {
    name: 'Nature Leaf Ring',
    description: 'A sculptural leaf wraps the finger, with finely veined detailing on each petal.',
    category: 'ring', karat: 18, weightGrams: 4.2, price: 365, inStock: true, order: 9,
  },
  {
    name: "Men's Heavy Signet Ring",
    description: 'A substantial flat-top signet ring sized for men. Can be custom-engraved upon request.',
    category: 'ring', karat: 22, weightGrams: 10.5, price: 1050, inStock: true, order: 10,
  },

  // ── Necklaces / گردنبند ─────────────────────────────────────────────
  {
    name: 'Herringbone Chain 18"',
    description: 'Ultra-flat herringbone links create a liquid, ribbon-like drape on the neck.',
    category: 'necklace', karat: 18, weightGrams: 8.5, price: 750, inStock: true, order: 11,
  },
  {
    name: 'Persian Star Pendant Necklace',
    description: 'Six-pointed star pendant on a fine rolo chain — inspired by Persian geometric art.',
    category: 'necklace', karat: 18, weightGrams: 6.2, price: 545, inStock: true, order: 12,
  },
  {
    name: 'Box Chain 18"',
    description: 'Classic square box links with a secure lobster clasp. Pairs well with any pendant.',
    category: 'necklace', karat: 22, weightGrams: 10.0, price: 995, inStock: true, order: 13,
  },
  {
    name: 'Rope Chain 20"',
    description: 'Tightly twisted round links form a bold rope silhouette — a wardrobe staple for men and women.',
    category: 'necklace', karat: 21, weightGrams: 12.0, price: 1150, inStock: true, order: 14,
  },
  {
    name: 'Figaro Chain 16"',
    description: 'Three small round links alternating with one elongated oval link — a classic Italian chain style.',
    category: 'necklace', karat: 18, weightGrams: 7.0, price: 620, inStock: true, order: 15,
  },
  {
    name: 'Heart Locket Necklace',
    description: 'Polished heart locket on a delicate cable chain — holds two small photos inside.',
    category: 'necklace', karat: 18, weightGrams: 5.5, price: 480, inStock: true, order: 16,
  },
  {
    name: 'Curb Chain 22"',
    description: 'Thick, flat curb links with a diamond cut edge give this chain a bold, masculine look.',
    category: 'necklace', karat: 22, weightGrams: 14.0, price: 1400, inStock: true, order: 17,
  },
  {
    name: 'Byzantine Chain 18"',
    description: 'Complex interlocking Byzantine links — an ancient weave pattern that looks extraordinary up close.',
    category: 'necklace', karat: 21, weightGrams: 16.0, price: 1530, inStock: false, order: 18,
  },
  {
    name: 'Omega Collar Necklace 16"',
    description: 'Rigid omega-link collar with a smooth, polished surface that lays perfectly flat against the neck.',
    category: 'necklace', karat: 18, weightGrams: 18.0, price: 1580, inStock: true, order: 19,
  },
  {
    name: 'Ball Station Necklace 18"',
    description: 'Evenly spaced gold ball stations on a fine trace chain — minimal and modern.',
    category: 'necklace', karat: 18, weightGrams: 4.0, price: 350, inStock: true, order: 20,
  },

  // ── Bracelets / دستبند ──────────────────────────────────────────────
  {
    name: 'Tennis Bracelet 7"',
    description: 'Continuous line of princess-cut cubic zirconia set in 18K gold — the ultimate classic.',
    category: 'bracelet', karat: 18, weightGrams: 9.0, price: 790, inStock: true, order: 21,
  },
  {
    name: 'Persian Bangle Set (2 pcs)',
    description: 'Two solid bangles — one plain, one engraved with traditional Persian poetry script.',
    category: 'bracelet', karat: 21, weightGrams: 15.0, price: 1440, inStock: true, order: 22,
  },
  {
    name: 'Figaro Link Bracelet 7"',
    description: 'Matching the popular chain style, this bracelet features a lobster clasp and sturdy figaro links.',
    category: 'bracelet', karat: 18, weightGrams: 7.5, price: 660, inStock: true, order: 23,
  },
  {
    name: 'Charm Bracelet',
    description: 'Rolo chain bracelet with five pre-attached gold charms: star, heart, crescent, key, and lock.',
    category: 'bracelet', karat: 18, weightGrams: 6.0, price: 525, inStock: true, order: 24,
  },
  {
    name: 'Wide Cuff Bangle',
    description: 'A bold, hinged cuff with a brushed finish on one side and polished on the other.',
    category: 'bracelet', karat: 22, weightGrams: 18.0, price: 1800, inStock: false, order: 25,
  },
  {
    name: 'Snake Chain Bracelet 7"',
    description: 'Smooth, flexible snake links that move like water on the wrist. Lightweight and comfortable.',
    category: 'bracelet', karat: 18, weightGrams: 5.0, price: 440, inStock: true, order: 26,
  },
  {
    name: 'Herringbone Bracelet 7"',
    description: 'A flat herringbone-link bracelet that mirrors our popular necklace chain style.',
    category: 'bracelet', karat: 21, weightGrams: 8.0, price: 770, inStock: true, order: 27,
  },
  {
    name: 'ID Bar Bracelet',
    description: 'Engravable rectangular bar on a curb-link chain — a personalised gift idea.',
    category: 'bracelet', karat: 18, weightGrams: 7.0, price: 615, inStock: true, order: 28,
  },

  // ── Earrings / گوشواره ───────────────────────────────────────────────
  {
    name: 'Classic Hoop Earrings 25mm',
    description: 'Seamless tube hoops with a click-close mechanism. Lightweight enough for all-day wear.',
    category: 'earring', karat: 18, weightGrams: 3.5, price: 305, inStock: true, order: 29,
  },
  {
    name: 'Teardrop Stud Earrings',
    description: 'Polished teardrop studs on friction-back posts — a refined minimalist choice.',
    category: 'earring', karat: 18, weightGrams: 2.0, price: 175, inStock: true, order: 30,
  },
  {
    name: 'Persian Drop Earrings',
    description: 'Elongated drops featuring granulation beadwork and a subtle twist — handmade in the Persian tradition.',
    category: 'earring', karat: 21, weightGrams: 4.5, price: 430, inStock: true, order: 31,
  },
  {
    name: 'Huggie Hoop Earrings',
    description: 'Small hinged hoops that hug close to the earlobe — perfect for cartilage or second piercings.',
    category: 'earring', karat: 18, weightGrams: 2.8, price: 245, inStock: true, order: 32,
  },
  {
    name: 'Chandelier Earrings',
    description: 'Multi-tier chandelier drops with open-frame petals — a show-stopping choice for special occasions.',
    category: 'earring', karat: 18, weightGrams: 5.2, price: 455, inStock: true, order: 33,
  },
  {
    name: 'Twisted Hoop Earrings 30mm',
    description: 'Round hoops with a rope-twist texture — a subtle detail that elevates a simple silhouette.',
    category: 'earring', karat: 22, weightGrams: 3.0, price: 300, inStock: false, order: 34,
  },
  {
    name: 'Ball Stud Earrings 6mm',
    description: 'Simple polished ball studs in pure 24K gold — hypoallergenic and ideal for sensitive ears.',
    category: 'earring', karat: 24, weightGrams: 1.5, price: 165, inStock: true, order: 35,
  },

  // ── Pendants / آویز ──────────────────────────────────────────────────
  {
    name: 'Persian Calligraphy Pendant',
    description: 'The word "Allah" rendered in flowing Nastaliq calligraphy — a meaningful and wearable piece of art.',
    category: 'pendant', karat: 21, weightGrams: 4.0, price: 385, inStock: true, order: 36,
  },
  {
    name: 'Evil Eye (Cheshm Nazar) Pendant',
    description: 'Traditional protective evil-eye charm with blue enamel inlay set in 18K gold.',
    category: 'pendant', karat: 18, weightGrams: 3.0, price: 265, inStock: true, order: 37,
  },
  {
    name: 'Hamsa Hand Pendant',
    description: 'The open hand symbol of protection and blessings, with fine filigree cut-out detailing.',
    category: 'pendant', karat: 18, weightGrams: 4.5, price: 395, inStock: true, order: 38,
  },
  {
    name: 'Persian Lion Pendant',
    description: 'Bold lion head pendant inspired by the Shir-o-Khorshid — a symbol of Persian heritage and courage.',
    category: 'pendant', karat: 21, weightGrams: 5.5, price: 530, inStock: true, order: 39,
  },
  {
    name: 'Ancient Persian Coin Pendant',
    description: 'Replica of an Achaemenid-era coin mounted in a 22K bezel — a wearable piece of history.',
    category: 'pendant', karat: 22, weightGrams: 6.0, price: 600, inStock: false, order: 40,
  },

  // ── Other / سایر ─────────────────────────────────────────────────────
  {
    name: 'Gold Coin 1/10 oz (24K)',
    description: 'Investment-grade 24K gold coin — 1/10 troy ounce. Comes in a protective capsule.',
    category: 'other', karat: 24, weightGrams: 3.11, price: 345, inStock: true, order: 41,
  },
  {
    name: 'Gold Bar 1 gram (24K)',
    description: 'LBMA-certified 1 gram fine gold bar with assay certificate card.',
    category: 'other', karat: 24, weightGrams: 1.0, price: 115, inStock: true, order: 42,
  },
  {
    name: 'Persian Love Lock Charm',
    description: 'A miniature padlock charm engraved with the Persian word for love — "Eshgh". Sold without chain.',
    category: 'other', karat: 18, weightGrams: 2.5, price: 220, inStock: true, order: 43,
  },
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
    const { buy, sell, order, ...meta } = c;
    await CurrencyModel.updateOne(
      { code: c.code },
      { $set: meta, $setOnInsert: { buy, sell, order } },
      { upsert: true },
    );
  }
  console.log(`[seed] currencies ensured: ${seedCurrencies.length}`);

  for (const g of seedGold) {
    await GoldPriceModel.updateOne({ karat: g.karat }, { $setOnInsert: g }, { upsert: true });
  }
  console.log(`[seed] gold prices ensured: ${seedGold.length}`);

  for (const p of seedProducts) {
    await ProductModel.updateOne(
      { name: p.name },
      { $setOnInsert: p },
      { upsert: true },
    );
  }
  console.log(`[seed] products ensured: ${seedProducts.length}`);

  // Seed 30 days of gold price history with a realistic random walk
  const bases: Record<number, number> = { 18: 78.0, 22: 95.0, 24: 104.0 };
  let seededHistory = 0;
  for (const karat of [18, 22, 24] as const) {
    let price = bases[karat] ?? 90;
    for (let d = 29; d >= 0; d--) {
      const date = new Date();
      date.setDate(date.getDate() - d);
      date.setHours(0, 0, 0, 0);
      // Small daily drift ±1.5% with slight upward trend
      const drift = (Math.random() - 0.47) * price * 0.015;
      price = Math.round((price + drift) * 100) / 100;
      await GoldPriceHistoryModel.updateOne(
        { karat, recordedAt: date },
        { $setOnInsert: { karat, pricePerGram: price, recordedAt: date } },
        { upsert: true },
      );
      seededHistory++;
    }
  }
  console.log(`[seed] gold history ensured: ${seededHistory} records`);

  await mongoose.disconnect();
  console.log('[seed] done');
}

main().catch((err) => {
  console.error('[seed] failed', err);
  process.exit(1);
});
