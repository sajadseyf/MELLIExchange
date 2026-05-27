import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'fa', 'ar', 'zh'] as const,
  defaultLocale: 'en',
  // Disable automatic Link header hreflang injection — we emit it ourselves
  // via generateMetadata so x-default always points to a non-redirecting URL.
  alternateLinks: false,
});

export type Locale = (typeof routing.locales)[number];
