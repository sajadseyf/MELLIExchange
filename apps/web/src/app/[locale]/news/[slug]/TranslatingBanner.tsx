'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Post } from '@melli/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

interface Props { locale: string; slug: string }

export default function TranslatingBanner({ locale, slug }: Props) {
  const router = useRouter();

  const checkTranslation = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/posts/${slug}`);
      if (!res.ok) return false;
      const post: Post = await res.json();
      const tr = locale === 'fa' ? post.translations?.fa : locale === 'zh' ? post.translations?.zh : undefined;
      return Boolean(tr?.title);
    } catch {
      return false;
    }
  }, [slug, locale]);

  useEffect(() => {
    const timer = setInterval(async () => {
      const ready = await checkTranslation();
      if (ready) {
        clearInterval(timer);
        router.refresh();
      }
    }, 15_000);
    return () => clearInterval(timer);
  }, [checkTranslation, router]);

  return (
    <div className="mb-4 flex items-center gap-2 rounded-lg border border-gold-200 bg-gold-50 px-4 py-3 text-sm text-gold-700 dark:border-gold-800 dark:bg-gold-900/20 dark:text-gold-400">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-gold-500 border-t-transparent" />
      {locale === 'fa'
        ? 'در حال ترجمه... چند لحظه صبر کنید، صفحه خودکار به‌روز می‌شود.'
        : '正在翻译中，请稍候，页面将自动更新。'}
    </div>
  );
}
