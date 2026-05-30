import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';
import { routing } from '@/i18n/routing';
import { getPosts } from '@/lib/api';

const BASE = site.url;
const locales = routing.locales;

const staticPages = [
  { path: '',           priority: 1.0,  changeFrequency: 'daily'   },
  { path: '/currencies',priority: 0.9,  changeFrequency: 'hourly'  },
  { path: '/gold',      priority: 0.9,  changeFrequency: 'hourly'  },
  { path: '/products',  priority: 0.8,  changeFrequency: 'weekly'  },
  { path: '/news',      priority: 0.8,  changeFrequency: 'daily'   },
  { path: '/faq',       priority: 0.7,  changeFrequency: 'monthly' },
  { path: '/about',     priority: 0.6,  changeFrequency: 'monthly' },
  { path: '/contact',   priority: 0.6,  changeFrequency: 'monthly' },
] as const;

function hreflang(path: string) {
  return {
    'x-default': `${BASE}/en${path}`,
    ...Object.fromEntries(locales.map((l) => [l, `${BASE}/${l}${path}`])),
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  // One <url> entry per locale per static page so Google indexes every locale URL directly
  for (const { path, priority, changeFrequency } of staticPages) {
    for (const locale of locales) {
      entries.push({
        url: `${BASE}/${locale}${path}`,
        lastModified: now,
        changeFrequency,
        priority: locale === 'en' ? priority : Math.round(priority * 0.9 * 10) / 10,
        alternates: { languages: hreflang(path) },
      });
    }
  }

  // Dynamic news/blog posts — one entry per locale
  try {
    const posts = await getPosts();
    for (const post of posts) {
      const slug = (post as any).slug;
      if (!slug) continue;
      const lastModified = new Date((post as any).updatedAt ?? (post as any).createdAt ?? now);
      for (const locale of locales) {
        entries.push({
          url: `${BASE}/${locale}/news/${slug}`,
          lastModified,
          changeFrequency: 'weekly',
          priority: locale === 'en' ? 0.6 : 0.5,
          alternates: { languages: hreflang(`/news/${slug}`) },
        });
      }
    }
  } catch {
    // posts unavailable — skip dynamic news entries
  }

  return entries;
}
