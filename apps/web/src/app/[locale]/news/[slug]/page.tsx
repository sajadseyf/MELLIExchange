import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Container, Card } from '@melli/ui';
import { getPost } from '@/lib/api';
import { pageAlternates } from '@/lib/seo';
import { site } from '@/lib/site';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import TranslatingBanner from './TranslatingBanner';

interface Props { params: { locale: string; slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost(params.slug);
  if (!post) return {};

  const locale = params.locale ?? 'en';
  const tr = locale === 'fa' ? post.translations?.fa : locale === 'zh' ? post.translations?.zh : undefined;
  const title = tr?.title || post.title;
  const description = tr?.excerpt || post.excerpt || title;
  const path = `/news/${params.slug}`;

  return {
    title: { absolute: `${title} | ${site.name}` },
    description,
    alternates: pageAlternates(path, locale),
    openGraph: {
      type: 'article',
      title,
      description,
      url: `${site.url}/${locale}${path}`,
      siteName: site.name,
      ...(post.coverImage ? { images: [{ url: post.coverImage, alt: title }] } : {}),
      publishedTime: post.publishedAt ?? undefined,
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { locale, slug } = params;
  const post = await getPost(slug);

  if (!post) notFound();

  const tr      = locale === 'fa' ? post.translations?.fa : locale === 'zh' ? post.translations?.zh : undefined;
  const title   = tr?.title   || post.title;
  const excerpt = tr?.excerpt || post.excerpt;
  const content = tr?.content || post.content;
  const isRtl   = locale === 'fa' || locale === 'ar';
  const needsTranslation = (locale === 'fa' || locale === 'zh') && !tr?.title;

  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: excerpt,
    datePublished: post.publishedAt,
    dateModified: (post as any).updatedAt ?? post.publishedAt,
    author: { '@type': 'Organization', name: site.name, url: site.url },
    publisher: { '@type': 'Organization', name: site.name, logo: `${site.url}/logo.png` },
    url: `${site.url}/${locale}/news/${slug}`,
    ...(post.coverImage ? { image: post.coverImage } : {}),
  };

  return (
    <Container className="py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <div className="mx-auto max-w-3xl">
        <Link
          href={`/${locale}/news`}
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-700 dark:text-zinc-500 dark:hover:text-zinc-300"
        >
          ← {locale === 'fa' ? 'پایش بازار' : locale === 'ar' ? 'رصد السوق' : locale === 'zh' ? '市场观察' : 'Market Watch'}
        </Link>

        {needsTranslation && <TranslatingBanner locale={locale} slug={slug} />}

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
