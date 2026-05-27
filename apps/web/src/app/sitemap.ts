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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  // Static pages — one entry per locale, x-default points to the English URL
  for (const { path, priority, changeFrequency } of staticPages) {
    entries.push({
      url: `${BASE}/en${path}`,
      lastModified: now,
      changeFrequency,
      priority,
      alternates: {
        languages: {
          'x-default': `${BASE}/en${path}`,
          ...Object.fromEntries(locales.map((locale) => [locale, `${BASE}/${locale}${path}`])),
        },
      },
    });
  }

  // Dynamic news/blog posts
  try {
    const posts = await getPosts();
    for (const post of posts) {
      const slug = (post as any).slug;
      if (!slug) continue;
      entries.push({
        url: `${BASE}/en/news/${slug}`,
        lastModified: new Date((post as any).updatedAt ?? (post as any).createdAt ?? now),
        changeFrequency: 'weekly',
        priority: 0.6,
        alternates: {
          languages: {
            'x-default': `${BASE}/en/news/${slug}`,
            ...Object.fromEntries(locales.map((locale) => [locale, `${BASE}/${locale}/news/${slug}`])),
          },
        },
      });
    }
  } catch {
    // posts unavailable — skip dynamic news entries
  }

  return entries;
}
