import { Card } from '@melli/ui';
import type { GoldPrice } from '@melli/types';

const KARAT_LABELS: Record<number, string> = {
  18: 'Fine for jewelry and design pieces',
  22: 'Traditional high-purity standard',
  24: 'Pure gold — investment grade',
};

export function GoldCards({ rows }: { rows: GoldPrice[] }) {
  if (rows.length === 0) {
    return (
      <Card className="p-8 text-center text-sm text-ink-500">
        Gold prices are being updated. Please check back shortly.
      </Card>
    );
  }
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((g) => (
        <Card key={g.karat} className="relative overflow-hidden p-6">
          <div
            aria-hidden
            className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gold-100 opacity-60"
          />
          <div className="relative">
            <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-gold-600">
              {g.karat}-karat gold
            </div>
            <div className="font-serif text-4xl text-ink-900">
              CAD {g.pricePerGram.toFixed(2)}
              <span className="ml-2 text-base font-normal text-ink-400">/ gram</span>
            </div>
            <p className="mt-3 text-sm text-ink-500">{KARAT_LABELS[g.karat]}</p>
            <p className="mt-4 text-xs text-ink-400">
              Updated {new Date(g.updatedAt).toLocaleString()}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}
