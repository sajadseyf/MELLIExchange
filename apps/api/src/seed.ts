import bcrypt from 'bcryptjs';
import { connectDb } from './db.js';
import { env } from './env.js';
import { AdminModel } from './models/Admin.js';
import { CurrencyModel } from './models/Currency.js';
import { GoldPriceModel } from './models/GoldPrice.js';
import { ProductModel } from './models/Product.js';
import { GoldPriceHistoryModel } from './models/GoldPriceHistory.js';
import { CurrencyPriceHistoryModel } from './models/CurrencyPriceHistory.js';
import { FaqModel } from './models/Faq.js';
import mongoose from 'mongoose';

const seedFaqs = [
  {
    order: 0,
    question: {
      fa: 'آیا برای تبدیل ارز یا خرید طلا وقت قبلی لازم است؟',
      en: 'Do I need an appointment to exchange currency or buy gold?',
    },
    answer: {
      fa: 'خیر، نیاز به وقت قبلی نیست. در ساعات کاری مراجعه کنید و تیم ما بلافاصله به شما کمک خواهد کرد. اکثر تراکنش‌ها کمتر از ۵ دقیقه طول می‌کشند.',
      en: 'No appointment needed. Simply walk in during business hours and our team will assist you right away. Most transactions take under 5 minutes.',
    },
  },
  {
    order: 1,
    question: {
      fa: 'چه ارزهایی را تبدیل می‌کنید؟',
      en: 'What currencies do you exchange?',
    },
    answer: {
      fa: 'ما تمام ارزهای اصلی جهان از جمله دلار آمریکا، یورو، پوند، درهم امارات، ریال ایران، دلار کانادا و بسیاری دیگر را تبدیل می‌کنیم.',
      en: 'We exchange all major world currencies including USD, EUR, GBP, AED, IRR, CAD, and many more.',
    },
  },
  {
    order: 2,
    question: {
      fa: 'نرخ‌های شما چگونه تعیین می‌شود؟',
      en: 'How are your exchange rates set?',
    },
    answer: {
      fa: 'نرخ‌های ما بر اساس شرایط بازار روز به‌روز به‌روزرسانی می‌شوند. نرخی که مشاهده می‌کنید همان نرخی است که دریافت می‌کنید — بدون هیچ هزینه پنهانی.',
      en: 'Our rates are updated daily based on current market conditions. The rate displayed is the rate you receive — no hidden fees.',
    },
  },
  {
    order: 3,
    question: {
      fa: 'چه عیارهایی از طلا را خرید و فروش می‌کنید؟',
      en: 'What gold karats do you buy and sell?',
    },
    answer: {
      fa: 'ما طلای ۱۸، ۲۱، ۲۲ و ۲۴ عیار را خرید و فروش می‌کنیم. چه برای خرید جواهرات، چه برای سرمایه‌گذاری یا فروش طلای خود، قیمت‌گذاری شفاف ارائه می‌دهیم.',
      en: 'We deal in 18K, 21K, 22K, and 24K gold. Whether purchasing jewelry, investment gold, or selling your own gold, we offer fair and transparent pricing.',
    },
  },
  {
    order: 4,
    question: {
      fa: 'آیا جواهرات طلا هم می‌خرید؟',
      en: 'Do you buy gold jewelry or only sell it?',
    },
    answer: {
      fa: 'بله، هم خرید و هم فروش جواهرات و شمش طلا انجام می‌دهیم. طلای خود را بیاورید و تیم ما آن را ارزیابی کرده و قیمت رقابتی ارائه می‌دهد.',
      en: 'We both buy and sell gold jewelry and bullion. Bring your pieces in and our team will assess them and offer a competitive price.',
    },
  },
  {
    order: 5,
    question: {
      fa: 'آیا حداقل یا حداکثر مبلغ برای تبدیل ارز وجود دارد؟',
      en: 'Is there a minimum or maximum amount for currency exchange?',
    },
    answer: {
      fa: 'برای اکثر تراکنش‌ها حداقل مبلغی وجود ندارد. برای مبالغ بزرگ، لطفاً از قبل با ما تماس بگیرید تا ارز مورد نظر را آماده کنیم.',
      en: 'There is no minimum for most transactions. For large exchanges, please contact us in advance so we can ensure the required currency is available.',
    },
  },
  {
    order: 6,
    question: {
      fa: 'آیا دارای مجوز و تحت نظارت هستید؟',
      en: 'Are you regulated and licensed?',
    },
    answer: {
      fa: 'بله. ملی اکسچنج به طور کامل در FINTRAC ثبت شده و با تمام مقررات ضد پول‌شویی کانادا مطابقت دارد.',
      en: 'Yes. Melli Exchange is fully registered with FINTRAC and complies with all Canadian anti-money-laundering regulations.',
    },
  },
  {
    order: 7,
    question: {
      fa: 'آیا باید مدرک شناسایی همراه داشته باشم؟',
      en: 'Do I need to bring ID?',
    },
    answer: {
      fa: 'برای تراکنش‌های بالاتر از آستانه قانونی، ارائه مدرک شناسایی معتبر دولتی الزامی است.',
      en: 'For transactions above the regulatory threshold, a valid government-issued photo ID is required by Canadian law.',
    },
  },
  {
    order: 8,
    question: {
      fa: 'آدرس و ساعات کاری شما چیست؟',
      en: 'Where are you located and what are your hours?',
    },
    answer: {
      fa: 'ما در کوکیتلام، بریتیش کلمبیا واقع شده‌ایم. ساعات کاری: دوشنبه تا جمعه ۹:۳۰ صبح تا ۷ بعد از ظهر و شنبه ۱۰ صبح تا ۶ بعد از ظهر. یکشنبه‌ها تعطیل هستیم.',
      en: 'We are located in Coquitlam, BC. Hours: Monday–Friday 9:30 AM–7:00 PM, Saturday 10:00 AM–6:00 PM. Closed Sundays.',
    },
  },
];

const seedCurrencies = [
  // ── Major / VanEx top ────────────────────────────────────────────────────────
  { code: 'USD', name: 'US Dollar',              symbol: '$',    flag: 'us', buy: 1.3362, sell: 1.3702, order: 1 },
  { code: 'EUR', name: 'Euro',                   symbol: '€',    flag: 'eu', buy: 1.5715, sell: 1.6415, order: 2 },
  { code: 'GBP', name: 'British Pound',          symbol: '£',    flag: 'gb', buy: 1.8195, sell: 1.8674, order: 3 },
  { code: 'AUD', name: 'Australian Dollar',      symbol: 'A$',   flag: 'au', buy: 0.9358, sell: 0.9827, order: 4 },
  { code: 'CHF', name: 'Swiss Franc',            symbol: 'CHF',  flag: 'ch', buy: 1.6901, sell: 1.7761, order: 5 },
  { code: 'JPY', name: 'Japanese Yen',           symbol: '¥',    flag: 'jp', buy: 0.00863, sell: 0.00902, order: 6 },
  { code: 'CNY', name: 'Chinese Yuan',           symbol: '¥',    flag: 'cn', buy: 0.1873, sell: 0.2031, order: 7 },
  { code: 'HKD', name: 'Hong Kong Dollar',       symbol: 'HK$',  flag: 'hk', buy: 0.1685, sell: 0.1797, order: 8 },
  { code: 'SGD', name: 'Singapore Dollar',       symbol: 'S$',   flag: 'sg', buy: 1.0136, sell: 1.1117, order: 9 },
  { code: 'NZD', name: 'New Zealand Dollar',     symbol: 'NZ$',  flag: 'nz', buy: 0.7811, sell: 0.8235, order: 10 },
  // ── Middle East ──────────────────────────────────────────────────────────────
  { code: 'AED', name: 'UAE Dirham',             symbol: 'د.إ',  flag: 'ae', buy: 0.3477, sell: 0.3912, order: 11 },
  { code: 'SAR', name: 'Saudi Riyal',            symbol: '﷼',    flag: 'sa', buy: 0.3357, sell: 0.3858, order: 12 },
  { code: 'QAR', name: 'Qatari Riyal',           symbol: 'ر.ق',  flag: 'qa', buy: 0.3380, sell: 0.3964, order: 13 },
  { code: 'OMR', name: 'Omani Rial',             symbol: 'ر.ع.', flag: 'om', buy: 3.2461, sell: 3.8897, order: 14 },
  { code: 'EGP', name: 'Egyptian Pound',         symbol: '£',    flag: 'eg', buy: 0.02352, sell: 0.03122, order: 15 },
  { code: 'ILS', name: 'Israeli Shekel',         symbol: '₪',    flag: 'il', buy: 0.4418, sell: 0.4924, order: 16 },
  // ── Asia ─────────────────────────────────────────────────────────────────────
  { code: 'INR', name: 'Indian Rupee',           symbol: '₹',    flag: 'in', buy: 0.0139, sell: 0.0153, order: 17 },
  { code: 'MYR', name: 'Malaysian Ringgit',      symbol: 'RM',   flag: 'my', buy: 0.3350, sell: 0.3660, order: 18 },
  { code: 'THB', name: 'Thai Baht',              symbol: '฿',    flag: 'th', buy: 0.0415, sell: 0.0462, order: 19 },
  { code: 'KRW', name: 'South Korean Won',       symbol: '₩',    flag: 'kr', buy: 0.000871, sell: 0.000986, order: 20 },
  { code: 'IDR', name: 'Indonesian Rupiah',      symbol: 'Rp',   flag: 'id', buy: 0.00007621, sell: 0.00008364, order: 21 },
  { code: 'PHP', name: 'Philippine Peso',        symbol: '₱',    flag: 'ph', buy: 0.0216, sell: 0.0241, order: 22 },
  { code: 'VND', name: 'Vietnamese Dong',        symbol: '₫',    flag: 'vn', buy: 0.00005633, sell: 0.00006149, order: 23 },
  { code: 'TWD', name: 'Taiwan Dollar',          symbol: 'NT$',  flag: 'tw', buy: 0.04254, sell: 0.04572, order: 24 },
  { code: 'LKR', name: 'Sri Lankan Rupee',       symbol: '₨',    flag: 'lk', buy: 0.0038, sell: 0.0049, order: 25 },
  // ── Europe ───────────────────────────────────────────────────────────────────
  { code: 'SEK', name: 'Swedish Krona',          symbol: 'kr',   flag: 'se', buy: 0.1407, sell: 0.1510, order: 26 },
  { code: 'NOK', name: 'Norwegian Krone',        symbol: 'kr',   flag: 'no', buy: 0.1395, sell: 0.1512, order: 27 },
  { code: 'DKK', name: 'Danish Krone',           symbol: 'kr',   flag: 'dk', buy: 0.2002, sell: 0.2183, order: 28 },
  { code: 'PLN', name: 'Polish Zloty',           symbol: 'zł',   flag: 'pl', buy: 0.3607, sell: 0.3925, order: 29 },
  { code: 'CZK', name: 'Czech Koruna',           symbol: 'Kč',   flag: 'cz', buy: 0.0626, sell: 0.0692, order: 30 },
  { code: 'HUF', name: 'Hungarian Forint',       symbol: 'Ft',   flag: 'hu', buy: 0.004188, sell: 0.004602, order: 31 },
  // ── Americas ─────────────────────────────────────────────────────────────────
  { code: 'MXN', name: 'Mexican Peso',           symbol: '$',    flag: 'mx', buy: 0.07583, sell: 0.0870, order: 32 },
  { code: 'BRL', name: 'Brazilian Real',         symbol: 'R$',   flag: 'br', buy: 0.2739, sell: 0.3099, order: 33 },
  { code: 'ARS', name: 'Argentine Peso',         symbol: '$',    flag: 'ar', buy: 0.00093, sell: 0.00113, order: 34 },
  { code: 'COP', name: 'Colombian Peso',         symbol: '$',    flag: 'co', buy: 0.00035592, sell: 0.00041841, order: 35 },
  { code: 'CLP', name: 'Chilean Peso',           symbol: '$',    flag: 'cl', buy: 0.001423, sell: 0.001625, order: 36 },
  { code: 'PEN', name: 'Peruvian Sol',           symbol: 'S/',   flag: 'pe', buy: 0.3550, sell: 0.4050, order: 37 },
  { code: 'DOP', name: 'Dominican Peso',         symbol: '$',    flag: 'do', buy: 0.0212, sell: 0.0272, order: 38 },
  { code: 'JMD', name: 'Jamaican Dollar',        symbol: 'J$',   flag: 'jm', buy: 0.0081, sell: 0.0094, order: 39 },
  { code: 'CRC', name: 'Costa Rican Colón',      symbol: '₡',    flag: 'cr', buy: 0.002874, sell: 0.003233, order: 40 },
  // ── Africa & Other ───────────────────────────────────────────────────────────
  { code: 'ZAR', name: 'South African Rand',     symbol: 'R',    flag: 'za', buy: 0.0772, sell: 0.0862, order: 41 },
  { code: 'TRY', name: 'Turkish Lira',           symbol: '₺',    flag: 'tr', buy: 0.0289, sell: 0.0330, order: 42 },
  { code: 'FJD', name: 'Fijian Dollar',          symbol: 'FJ$',  flag: 'fj', buy: 0.5820, sell: 0.6997, order: 43 },
  // ── Special ──────────────────────────────────────────────────────────────────
  { code: 'IRR', name: 'Iranian Rial',           symbol: '﷼',    flag: 'ir', buy: 0.000022, sell: 0.000028, order: 44 },
];

const seedGold = [
  { karat: 14, pricePerGram: 60.5 },
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

  // ── 14K / چهارده عیار ────────────────────────────────────────────────
  {
    name: 'Delicate 14K Stacking Ring',
    description: 'Slim and lightweight 14K gold band, perfect for everyday stacking. Minimal and modern.',
    category: 'ring', karat: 14, weightGrams: 2.1, price: 175, inStock: true, order: 44,
  },
  {
    name: '14K Gold Chain Necklace 18"',
    description: 'Classic 14K cable chain, 18 inches. Lightweight and versatile — perfect as a standalone or layered look.',
    category: 'necklace', karat: 14, weightGrams: 4.0, price: 310, inStock: true, order: 45,
  },
  {
    name: '14K Huggie Hoop Earrings',
    description: 'Small huggie hoops in 14K yellow gold. Comfortable for all-day wear with a secure snap closure.',
    category: 'earring', karat: 14, weightGrams: 2.4, price: 210, inStock: true, order: 46,
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
  const bases: Record<number, number> = { 14: 60.5, 18: 78.0, 22: 95.0, 24: 104.0 };
  let seededHistory = 0;
  for (const karat of [14, 18, 22, 24] as const) {
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

  // Seed 30 days of currency price history
  const currencyBases: Record<string, { buy: number; sell: number }> = {
    USD: { buy: 1.36, sell: 1.40 },
    EUR: { buy: 1.46, sell: 1.50 },
    GBP: { buy: 1.72, sell: 1.78 },
    AED: { buy: 0.36, sell: 0.39 },
    IRR: { buy: 0.000022, sell: 0.000028 },
    CHF: { buy: 1.52, sell: 1.58 },
    AUD: { buy: 0.89, sell: 0.93 },
    CNY: { buy: 0.18, sell: 0.20 },
  };
  let seededCurrencyHistory = 0;
  for (const [code, base] of Object.entries(currencyBases)) {
    let buy = base.buy;
    let sell = base.sell;
    for (let d = 29; d >= 0; d--) {
      const date = new Date();
      date.setDate(date.getDate() - d);
      date.setHours(0, 0, 0, 0);
      const drift = (Math.random() - 0.48) * buy * 0.012;
      buy  = Math.round((buy  + drift) * 1e6) / 1e6;
      sell = Math.round((sell + drift) * 1e6) / 1e6;
      await CurrencyPriceHistoryModel.updateOne(
        { code, recordedAt: date },
        { $setOnInsert: { code, buy, sell, recordedAt: date } },
        { upsert: true },
      );
      seededCurrencyHistory++;
    }
  }
  console.log(`[seed] currency history ensured: ${seededCurrencyHistory} records`);

  for (const faq of seedFaqs) {
    await FaqModel.updateOne(
      { 'question.fa': faq.question.fa },
      { $setOnInsert: faq },
      { upsert: true },
    );
  }
  console.log(`[seed] faqs ensured: ${seedFaqs.length}`);

  await mongoose.disconnect();
  console.log('[seed] done');
}

main().catch((err) => {
  console.error('[seed] failed', err);
  process.exit(1);
});
