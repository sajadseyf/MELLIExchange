'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useTranslations } from 'next-intl';
import { Card, Badge } from '@melli/ui';
import type { Product, ProductCategory } from '@melli/types';

// ── Single product card ───────────────────────────────────────────────────────
function ProductCard({ product, t }: { product: Product; t: ReturnType<typeof useTranslations> }) {
  const [imgIndex, setImgIndex] = useState(0);
  const [imgError, setImgError] = useState(false);

  const images = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
  const hasMultiple = images.length > 1;
  const safeIndex = Math.min(imgIndex, Math.max(images.length - 1, 0));
  const currentImg = images[safeIndex] && !imgError ? images[safeIndex]! : null;

  const categoryLabel: Record<ProductCategory, string> = {
    ring:     t('cat_ring'),
    necklace: t('cat_necklace'),
    bracelet: t('cat_bracelet'),
    earring:  t('cat_earring'),
    pendant:  t('cat_pendant'),
    other:    t('cat_other'),
  };

  return (
    <Card className="flex flex-col overflow-hidden p-0">
      {/* Image area */}
      <div className="relative h-64 w-full overflow-hidden bg-gradient-to-br from-gold-50 to-gold-100 dark:from-dark-raised dark:to-dark-card">
        {currentImg ? (
          <Image
            key={currentImg}
            src={currentImg}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2">
            <span className="text-5xl">💍</span>
            <span className="text-xs font-medium text-ink-400 dark:text-zinc-500">{product.name}</span>
          </div>
        )}

        {hasMultiple && !imgError && (
          <>
            <button
              onClick={() => setImgIndex((i) => (i - 1 + images.length) % images.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60"
              aria-label="Previous image"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setImgIndex((i) => (i + 1) % images.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60"
              aria-label="Next image"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
            {/* Dot indicators */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setImgIndex(i)}
                  aria-label={`Image ${i + 1}`}
                  className={[
                    'rounded-full transition-all',
                    i === safeIndex ? 'h-1.5 w-4 bg-white' : 'h-1.5 w-1.5 bg-white/50',
                  ].join(' ')}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif text-lg leading-snug text-ink-900 dark:text-white">
            {product.name}
          </h3>
          {!product.inStock && <Badge tone="danger">{t('out_of_stock')}</Badge>}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge tone="gold">{product.karat}K</Badge>
          <Badge tone="ink">{categoryLabel[product.category] ?? product.category}</Badge>
          <Badge tone="ink">{product.weightGrams}g</Badge>
        </div>

        {product.description && (
          <p className="line-clamp-2 text-sm leading-relaxed text-ink-500 dark:text-zinc-400">
            {product.description}
          </p>
        )}

        <div className="mt-auto pt-2">
          <div className="text-2xl font-bold tabular-nums text-ink-900 dark:text-white">
            ${product.price.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
            <span className="ml-1 text-sm font-normal text-ink-400 dark:text-zinc-500">CAD</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ── Filter bar ────────────────────────────────────────────────────────────────
const ALL_CATS: ('all' | ProductCategory)[] = ['all', 'ring', 'necklace', 'bracelet', 'earring', 'pendant', 'other'];
const ALL_KARATS = [0, 14, 18, 21, 22, 24] as const;

// ── Main grid ─────────────────────────────────────────────────────────────────
export function ProductGrid({ products }: { products: Product[] }) {
  const t = useTranslations('products');

  const [search,      setSearch]      = useState('');
  const [category,    setCategory]    = useState<'all' | ProductCategory>('all');
  const [karat,       setKarat]       = useState<0 | 14 | 18 | 21 | 22 | 24>(0);
  const [inStockOnly, setInStockOnly] = useState(false);

  const catLabel = (c: 'all' | ProductCategory) => {
    if (c === 'all') return t('cat_all');
    const map: Record<ProductCategory, string> = {
      ring: t('cat_ring'), necklace: t('cat_necklace'), bracelet: t('cat_bracelet'),
      earring: t('cat_earring'), pendant: t('cat_pendant'), other: t('cat_other'),
    };
    return map[c];
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return products.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q)) return false;
      if (category !== 'all' && p.category !== category) return false;
      if (karat !== 0 && p.karat !== karat) return false;
      if (inStockOnly && !p.inStock) return false;
      return true;
    });
  }, [products, search, category, karat, inStockOnly]);

  return (
    <div className="flex flex-col gap-6">
      {/* ── Filters ── */}
      <div className="flex flex-col gap-3">
        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400 dark:text-zinc-500" />
          <input
            type="search"
            placeholder={t('search_placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-9 pr-4 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-gold-400 dark:border-dark-border dark:bg-dark-card dark:text-white dark:placeholder:text-zinc-500"
          />
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-1.5">
          {ALL_CATS.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={[
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                category === c
                  ? 'bg-gold-100 text-gold-700 dark:bg-gold-900/40 dark:text-gold-400'
                  : 'bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-dark-raised dark:text-zinc-400 dark:hover:bg-dark-muted',
              ].join(' ')}
            >
              {catLabel(c)}
            </button>
          ))}
        </div>

        {/* Karat + In-stock row */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-ink-600 dark:text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wide">Karat</span>
            <div className="flex gap-1">
              {ALL_KARATS.map((k) => (
                <button
                  key={k}
                  onClick={() => setKarat(k)}
                  className={[
                    'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors',
                    karat === k
                      ? 'bg-ink-900 text-white dark:bg-white dark:text-ink-900'
                      : 'bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-dark-raised dark:text-zinc-400 dark:hover:bg-dark-muted',
                  ].join(' ')}
                >
                  {k === 0 ? 'All' : `${k}K`}
                </button>
              ))}
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="h-4 w-4 rounded border-ink-300 text-gold-600 focus:ring-gold-500"
            />
            In stock only
          </label>

          {(search || category !== 'all' || karat !== 0 || inStockOnly) && (
            <button
              onClick={() => { setSearch(''); setCategory('all'); setKarat(0); setInStockOnly(false); }}
              className="text-xs text-ink-400 underline hover:text-ink-600 dark:text-zinc-500 dark:hover:text-zinc-300"
            >
              Clear filters
            </button>
          )}

          <span className="ml-auto text-xs text-ink-400 dark:text-zinc-500">
            {filtered.length} / {products.length}
          </span>
        </div>
      </div>

      {/* ── Grid ── */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-ink-400 dark:text-zinc-500">
          {t('empty')}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}
