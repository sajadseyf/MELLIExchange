'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';

const LOCALES = [
  { code: 'en', label: 'EN' },
  { code: 'fa', label: 'فا' },
  { code: 'ar', label: 'عر' },
  { code: 'zh', label: '中' },
] as const;

export function LocaleSwitcher() {
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(locale: string) {
    router.replace(pathname, { locale });
  }

  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-ink-200 p-0.5 dark:border-dark-border">
      {LOCALES.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => switchLocale(code)}
          className={`rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
            currentLocale === code
              ? 'bg-gold-100 text-gold-700 dark:bg-gold-900/40 dark:text-gold-400'
              : 'text-ink-500 hover:text-ink-900 dark:text-zinc-400 dark:hover:text-white'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
