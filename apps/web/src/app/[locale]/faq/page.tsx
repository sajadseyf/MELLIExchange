import { Container, PageHeading } from '@melli/ui';
import { getTranslations } from 'next-intl/server';
import { getFaqs } from '@/lib/api';
import type { FaqItem } from '@melli/types';

export default async function FaqPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const [t, faqs] = await Promise.all([getTranslations('faq'), getFaqs()]);

  const items = faqs.length > 0
    ? faqs
        .map((item: FaqItem) => ({
          q: locale === 'fa'
            ? item.question.fa
            : locale === 'zh'
            ? (item.question.zh || item.question.en)
            : item.question.en,
          a: locale === 'fa'
            ? item.answer.fa
            : locale === 'zh'
            ? (item.answer.zh || item.answer.en)
            : item.answer.en,
        }))
        .filter((item) => item.q && item.a)
    : [
        { q: t('q1'), a: t('a1') },
        { q: t('q2'), a: t('a2') },
        { q: t('q3'), a: t('a3') },
        { q: t('q4'), a: t('a4') },
        { q: t('q5'), a: t('a5') },
        { q: t('q6'), a: t('a6') },
        { q: t('q7'), a: t('a7') },
        { q: t('q8'), a: t('a8') },
        { q: t('q9'), a: t('a9') },
      ];

  return (
    <Container className="py-14">
      <div className="flex flex-col gap-10">
        <PageHeading eyebrow={t('eyebrow')} title={t('title')} description={t('desc')} />

        <div className="mx-auto w-full max-w-3xl divide-y divide-ink-100 dark:divide-dark-border">
          {items.map((item, i) => (
            <details key={i} className="group py-5 first:pt-0">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                <span className="text-base font-semibold text-ink-900 group-open:text-gold-700 dark:text-white dark:group-open:text-gold-400">
                  {item.q}
                </span>
                <span className="mt-0.5 flex-shrink-0 text-ink-400 transition-transform duration-200 group-open:rotate-45 dark:text-zinc-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </span>
              </summary>
              <p className="mt-4 text-sm leading-relaxed text-ink-600 dark:text-zinc-400">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </Container>
  );
}
