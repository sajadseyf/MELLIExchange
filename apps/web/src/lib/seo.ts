import type { Metadata } from 'next';
import { site } from './site';

const LOCALES = ['en', 'fa', 'ar', 'zh'] as const;
type Locale = (typeof LOCALES)[number];

export function pageAlternates(path: string, locale: string) {
  const l = locale as Locale;
  return {
    canonical: `${site.url}/${l}${path}`,
    languages: {
      'x-default': `${site.url}/en${path}`,
      en: `${site.url}/en${path}`,
      fa: `${site.url}/fa${path}`,
      ar: `${site.url}/ar${path}`,
      zh: `${site.url}/zh${path}`,
    },
  };
}

type PageKey = 'home' | 'currencies' | 'gold' | 'products' | 'faq' | 'about' | 'contact' | 'news';

interface PageMeta { title: string; description: string }
const pageMeta: Record<PageKey, Record<Locale, PageMeta>> = {
  home: {
    en: {
      title: 'Melli Exchange | Currency Exchange & Gold Jewelry — Coquitlam, BC',
      description: 'Best currency exchange rates in Coquitlam and Vancouver. Buy & sell USD, EUR, GBP, AED and more. FINTRAC-registered gold jewelry dealer. Walk-ins welcome, open 7 days.',
    },
    fa: {
      title: 'ملی اکسچنج | صرافی کوکیتلام — ارز و جواهری طلا',
      description: 'بهترین نرخ ارز در کوکیتلام و ونکوور. خرید و فروش دلار، یورو، پوند، درهم و بیشتر. جواهری ایرانی ونکوور. ۷ روز در هفته باز است، بدون وقت قبلی.',
    },
    ar: {
      title: 'ملي إكسشينج | صرافة العملات والذهب — كوكيتلام، كندا',
      description: 'أفضل أسعار الصرف في كوكيتلام وفانكوفر. شراء وبيع الدولار واليورو والجنيه والدرهم والمزيد. مسجل في FINTRAC. مفتوح 7 أيام في الأسبوع.',
    },
    zh: {
      title: 'Melli Exchange | 高贵林货币兑换 & 黄金珠宝',
      description: '高贵林和温哥华最优惠的货币兑换汇率。买卖美元、欧元、英镑、迪拉姆等14种以上货币。FINTRAC注册黄金经销商。每周营业7天，欢迎直接来店。',
    },
  },
  currencies: {
    en: {
      title: 'Live Currency Exchange Rates — Coquitlam BC',
      description: 'Live CAD exchange rates for USD, EUR, GBP, AED, IRR and 14+ currencies. Best exchange rates in Vancouver — updated daily at Melli Exchange, Coquitlam.',
    },
    fa: {
      title: 'نرخ ارز امروز | صرافی کوکیتلام — ملی اکسچنج',
      description: 'نرخ زنده تبدیل ارز برای دلار، یورو، پوند، درهم، ریال و بیش از ۱۴ ارز. بهترین نرخ ارز ونکوور — بروزرسانی روزانه در ملی اکسچنج کوکیتلام.',
    },
    ar: {
      title: 'أسعار الصرف اليومية | صرافی كوكيتلام — ملي إكسشينج',
      description: 'أسعار صرف لحظية للدولار الأمريكي واليورو والجنيه والدرهم والريال الإيراني وأكثر من 14 عملة. أفضل أسعار الصرف في فانكوفر.',
    },
    zh: {
      title: '今日实时汇率 | 高贵林货币兑换 — Melli Exchange',
      description: '美元、欧元、英镑、迪拉姆、伊朗里亚尔等14种以上货币的实时加元兑换汇率。温哥华最优惠汇率，每日更新，高贵林Melli Exchange。',
    },
  },
  gold: {
    en: {
      title: 'Gold Prices Today — 18K, 21K, 22K, 24K | Melli Exchange Coquitlam',
      description: "Today's gold prices per gram in CAD. Live 18K, 21K, 22K and 24K gold rates at Melli Exchange, Coquitlam BC. Buy gold in Vancouver at the best price.",
    },
    fa: {
      title: 'قیمت طلا امروز | خرید طلا ونکوور — ملی اکسچنج',
      description: 'قیمت روز طلا به دلار کانادا. نرخ خرید طلای ۱۸، ۲۱، ۲۲ و ۲۴ عیار در ملی اکسچنج کوکیتلام. خرید طلا ونکوور با بهترین نرخ.',
    },
    ar: {
      title: 'أسعار الذهب اليوم — 18 و21 و22 و24 قيراط | ملي إكسشينج',
      description: 'أسعار الذهب اليومية للغرام بالدولار الكندي. أسعار عيارات 18 و21 و22 و24 قيراط في ملي إكسشينج، كوكيتلام بريتيش كولومبيا.',
    },
    zh: {
      title: '今日黄金价格 — 18K, 21K, 22K, 24K | 高贵林 Melli Exchange',
      description: '高贵林Melli Exchange每克黄金的加元价格。18K、21K、22K和24K黄金每日买入价。温哥华购买黄金的最优去处。',
    },
  },
  products: {
    en: {
      title: 'Gold Jewelry Shop Coquitlam — Rings, Necklaces & More | Melli Exchange',
      description: 'Browse fine gold jewelry at Melli Exchange, Coquitlam BC. 18K, 22K and 24K rings, necklaces, bracelets, earrings and pendants at competitive CAD prices.',
    },
    fa: {
      title: 'جواهری ایرانی ونکوور | طلا و جواهر — ملی اکسچنج کوکیتلام',
      description: 'جواهرات طلا در ملی اکسچنج کوکیتلام. انگشتر، گردنبند، دستبند، گوشواره و آویز طلای ۱۸، ۲۲ و ۲۴ عیار. قیمت مناسب به دلار کانادا.',
    },
    ar: {
      title: 'مجوهرات الذهب في كوكيتلام — ملي إكسشينج',
      description: 'تصفح مجوهرات الذهب الراقية في ملي إكسشينج، كوكيتلام. خواتم وقلائد وأساور وحلق ومعلقات بعيارات 18 و22 و24 قيراط بأسعار تنافسية.',
    },
    zh: {
      title: '高贵林黄金珠宝店 | 戒指、项链等 — Melli Exchange',
      description: '浏览高贵林Melli Exchange的精选黄金珠宝。18K、22K和24K戒指、项链、手链、耳环和挂坠，价格实惠，以加元计价。',
    },
  },
  faq: {
    en: {
      title: 'FAQ — Currency Exchange & Gold | Melli Exchange Coquitlam',
      description: 'Answers to common questions about currency exchange rates, gold prices, ID requirements, FINTRAC registration, and visiting Melli Exchange in Coquitlam, BC.',
    },
    fa: {
      title: 'سوالات متداول صرافی | ملی اکسچنج کوکیتلام',
      description: 'پاسخ سوالات رایج درباره نرخ ارز، قیمت طلا، مدارک لازم، ثبت FINTRAC و بازدید از ملی اکسچنج در کوکیتلام، بریتیش کلمبیا.',
    },
    ar: {
      title: 'الأسئلة الشائعة | ملي إكسشينج كوكيتلام',
      description: 'إجابات على الأسئلة الشائعة حول أسعار الصرف وأسعار الذهب ومتطلبات الهوية وترخيص FINTRAC وزيارة ملي إكسشينج في كوكيتلام.',
    },
    zh: {
      title: '常见问题 | 高贵林货币兑换 — Melli Exchange',
      description: '关于货币兑换汇率、黄金价格、身份证件要求、FINTRAC注册和前往高贵林Melli Exchange的常见问题解答。',
    },
  },
  about: {
    en: {
      title: 'About Melli Exchange — FINTRAC Registered Currency & Gold Dealer, Coquitlam BC',
      description: 'Learn about Melli Exchange — a FINTRAC-registered currency exchange and gold jewelry dealer serving Coquitlam and Greater Vancouver since 2014.',
    },
    fa: {
      title: 'درباره ما | صرافی معتبر کانادا — ملی اکسچنج',
      description: 'درباره ملی اکسچنج بیشتر بدانید — صرافی ثبت‌شده در FINTRAC و فروشنده طلا و جواهرات در کوکیتلام و ونکوور بزرگ از سال ۲۰۱۴.',
    },
    ar: {
      title: 'عن ملي إكسشينج — صرافة مسجلة في FINTRAC، كوكيتلام بريتيش كولومبيا',
      description: 'تعرف على ملي إكسشينج — صرافة عملات وتاجر مجوهرات ذهب مرخص من FINTRAC يخدم كوكيتلام ومنطقة فانكوفر الكبرى منذ عام 2014.',
    },
    zh: {
      title: '关于我们 | Melli Exchange — 高贵林 FINTRAC注册货币兑换商',
      description: '了解Melli Exchange — 自2014年起服务高贵林和大温哥华地区的FINTRAC注册货币兑换商和黄金珠宝经销商。',
    },
  },
  contact: {
    en: {
      title: 'Contact Melli Exchange | Currency Exchange Coquitlam BC',
      description: 'Visit Melli Exchange at Unit 1102, Henderson Place Mall, Coquitlam BC. Call (778) 752-7386 or 1-877-867-7090. Open Mon–Sat 10 AM–7 PM, Sun 10 AM–5 PM.',
    },
    fa: {
      title: 'تماس با ما | صرافی ملی اکسچنج کوکیتلام',
      description: 'به ملی اکسچنج در Unit 1102، Henderson Place Mall، کوکیتلام مراجعه کنید. با (778) 752-7386 تماس بگیرید. ساعت کاری: دوشنبه تا شنبه ۱۰ صبح – ۷ عصر، یکشنبه ۱۰ صبح – ۵ عصر.',
    },
    ar: {
      title: 'اتصل بنا | ملي إكسشينج كوكيتلام',
      description: 'تفضل بزيارة ملي إكسشينج في Unit 1102، Henderson Place Mall، كوكيتلام. اتصل على (778) 752-7386. مفتوح الاثنين–السبت 10ص–7م، الأحد 10ص–5م.',
    },
    zh: {
      title: '联系我们 | Melli Exchange 高贵林货币兑换',
      description: '前往高贵林Melli Exchange，地址：Unit 1102, Henderson Place Mall，高贵林BC。电话：(778) 752-7386。营业时间：周一至周六10:00-19:00，周日10:00-17:00。',
    },
  },
  news: {
    en: {
      title: 'Currency & Gold Market News | Melli Exchange Vancouver',
      description: 'Latest currency exchange and gold market news. USD, EUR, GBP, CAD rate analysis from VBCE, FXStreet, and Melli Exchange. Stay informed on exchange rates.',
    },
    fa: {
      title: 'اخبار بازار ارز و طلا | ملی اکسچنج',
      description: 'آخرین اخبار بازار ارز و طلا. تحلیل دلار، یورو، پوند و دلار کانادا از VBCE، FXStreet و تیم ملی اکسچنج.',
    },
    ar: {
      title: 'أخبار أسواق العملات والذهب | ملي إكسشينج',
      description: 'آخر أخبار صرف العملات وأسواق الذهب. تحليلات USD وEUR وGBP وCAD من VBCE وFXStreet وفريق ملي إكسشينج.',
    },
    zh: {
      title: '货币与黄金市场新闻 | Melli Exchange',
      description: '最新货币兑换和黄金市场新闻。来自VBCE、FXStreet和Melli Exchange团队的美元、欧元、英镑、加元分析报告。',
    },
  },
};

const pageKeywords: Record<PageKey, string[]> = {
  home: [
    'currency exchange Coquitlam', 'currency exchange Vancouver', 'buy gold Coquitlam',
    'gold jewelry Vancouver', 'best exchange rate Vancouver', 'FINTRAC registered currency exchange BC',
    'صرافی کوکیتلام', 'صرافی ونکوور', 'خرید طلا ونکوور', 'بهترین نرخ ارز ونکوور',
    'جواهری ایرانی ونکوور', 'صرافی معتبر کانادا',
  ],
  currencies: [
    'currency exchange Coquitlam', 'exchange rate Vancouver', 'USD CAD rate', 'EUR CAD rate',
    'live exchange rates Canada', 'best exchange rate Vancouver', 'صرافی کوکیتلام', 'نرخ ارز ونکوور',
  ],
  gold: [
    'buy gold Coquitlam', 'gold price Vancouver', 'gold jewelry Vancouver', 'gold dealer BC',
    '18K gold price CAD', 'خرید طلا ونکوور', 'قیمت طلا ونکوور', 'بهترین نرخ ارز ونکوور',
  ],
  products: [
    'gold jewelry Vancouver', 'gold rings Coquitlam', 'gold necklace Vancouver',
    'Iranian jewelry Vancouver', 'جواهری ایرانی ونکوور', 'طلا و جواهر کوکیتلام',
  ],
  faq: [
    'currency exchange FAQ Coquitlam', 'FINTRAC registered currency exchange BC',
    'gold exchange questions Vancouver', 'صرافی سوالات متداول',
  ],
  about: [
    'Melli Exchange Coquitlam', 'FINTRAC registered currency exchange BC',
    'صرافی معتبر کانادا', 'currency exchange Coquitlam',
  ],
  contact: [
    'currency exchange Coquitlam address', 'Melli Exchange hours', 'gold dealer Coquitlam',
    'صرافی کوکیتلام آدرس',
  ],
  news: [
    'gold market news Vancouver', 'currency exchange news Canada', 'CAD exchange rate news',
  ],
};

const ogLocale: Record<Locale, string> = {
  en: 'en_CA', fa: 'fa_IR', ar: 'ar_AE', zh: 'zh_CN',
};

export function getPageMetadata(
  page: PageKey,
  locale: string,
  path: string,
): Pick<Metadata, 'title' | 'description' | 'alternates' | 'openGraph' | 'keywords'> {
  const l = (LOCALES as readonly string[]).includes(locale) ? (locale as Locale) : 'en';
  const { title, description } = pageMeta[page][l];

  return {
    title: { absolute: title },
    description,
    keywords: pageKeywords[page],
    alternates: pageAlternates(path, l),
    openGraph: {
      type: 'website',
      locale: ogLocale[l],
      url: `${site.url}/${l}${path}`,
      siteName: site.name,
      title,
      description,
      images: [{ url: `${site.url}/og-image.png`, width: 1200, height: 630, alt: site.name }],
    },
  };
}
