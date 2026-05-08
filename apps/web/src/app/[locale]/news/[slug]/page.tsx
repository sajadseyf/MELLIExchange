'use client';

import { useEffect, useState, useCallback } from 'react';
import { Container, Card } from '@melli/ui';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import ReactMarkdown from 'react-markdown';
import type { Post } from '@melli/types';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const TRANSLATED_LOCALES = ['fa', 'zh'] as const;
type TranslatedLocale = typeof TRANSLATED_LOCALES[number];

function needsTranslation(locale: string): locale is TranslatedLocale {
  return (TRANSLATED_LOCALES as readonly string[]).includes(locale);
}

function getTranslation(post: Post, locale: string) {
  if (locale === 'fa') return post.translations?.fa;
  if (locale === 'zh') return post.translations?.zh;
  return undefined;
}

interface Props { params: { slug: string } }

export default function PostPage({ params }: Props) {
  const locale = useLocale();
  const router = useRouter();

  const [post,    setPost]    = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPost = useCallback(() => {
    return fetch(`${API_URL}/api/posts/${params.slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Post | null) => {
        setPost(data);
        setLoading(false);
        return data;
      })
      .catch(() => { setLoading(false); return null; });
  }, [params.slug]);

  useEffect(() => {
    fetchPost().then((data) => {
      if (!data) return;
      // If locale needs translation and it's missing, keep polling until ready
      if (needsTranslation(locale) && !getTranslation(data, locale)?.title) {
        const timer = setInterval(async () => {
          const updated = await fetchPost();
          if (updated && getTranslation(updated, locale)?.title) {
            clearInterval(timer);
          }
        }, 15_000);
        return () => clearInterval(timer);
      }
    });
  }, [fetchPost, locale]);

  if (loading) {
    return (
      <Container className="py-14">
        <div className="flex h-64 items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-gold-400 border-t-transparent" />
        </div>
      </Container>
    );
  }

  if (!post) { router.replace('/news'); return null; }

  const tr      = getTranslation(post, locale);
  const title   = tr?.title   || post.title;
  const excerpt = tr?.excerpt || post.excerpt;
  const content = tr?.content || post.content;
  const isRtl   = locale === 'fa';
  const isTranslating = needsTranslation(locale) && !tr?.title;

  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  return (
    <Container className="py-14">
      <div className="mx-auto max-w-3xl">
        <Link
          href={`/${locale}/news`}
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-700 dark:text-zinc-500 dark:hover:text-zinc-300"
        >
          ← Market Watch
        </Link>

        {isTranslating && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-gold-200 bg-gold-50 px-4 py-3 text-sm text-gold-700 dark:border-gold-800 dark:bg-gold-900/20 dark:text-gold-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gold-500 border-t-transparent" />
            {locale === 'fa'
              ? 'در حال ترجمه... چند لحظه صبر کنید، صفحه خودکار به‌روز می‌شود.'
              : '正在翻译中，请稍候，页面将自动更新。'}
          </div>
        )}

        <Card className="overflow-hidden">
          {post.coverImage && (
            <img
              src={post.coverImage}
              alt={title}
              className="h-64 w-full object-cover sm:h-80"
            />
          )}

          <div className="p-6 sm:p-10" dir={isRtl ? 'rtl' : 'ltr'}>
            {post.tags.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-gold-100 px-2.5 py-0.5 text-xs font-medium text-gold-700 dark:bg-gold-900/30 dark:text-gold-400">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <h1 className="text-2xl font-bold text-ink-900 dark:text-white sm:text-3xl">
              {title}
            </h1>

            {date && (
              <p className="mt-2 text-sm text-ink-400 dark:text-zinc-500" dir="ltr">{date}</p>
            )}

            {excerpt && (
              <p className="mt-4 border-s-4 border-gold-400 ps-4 text-base italic text-ink-600 dark:text-zinc-300">
                {excerpt}
              </p>
            )}

            <div
              className="mt-8 text-sm leading-7 text-ink-700 dark:text-zinc-300 [&_a]:text-gold-600 [&_a]:underline [&_blockquote]:border-s-4 [&_blockquote]:border-gold-300 [&_blockquote]:ps-4 [&_blockquote]:italic [&_h1]:mb-2 [&_h1]:mt-6 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:mb-2 [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mb-1 [&_h3]:mt-4 [&_h3]:font-semibold [&_hr]:my-4 [&_li]:ms-4 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:ps-4 [&_p]:my-2 [&_strong]:font-semibold [&_strong]:text-ink-900 dark:[&_strong]:text-white [&_ul]:my-3 [&_ul]:list-disc [&_ul]:ps-4"
              dir={isRtl ? 'rtl' : 'ltr'}
            >
              <ReactMarkdown>{content ?? ''}</ReactMarkdown>
            </div>
          </div>
        </Card>
      </div>
    </Container>
  );
}
