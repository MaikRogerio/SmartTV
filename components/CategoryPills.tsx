import { cn } from '@/lib/utils';

export default function CategoryPills({ categories, active, onSelect }: { categories: string[]; active: string; onSelect: (c: string) => void }) {
  const items = ['ALL', ...categories];
  return (
    <div className="no-scrollbar flex gap-2.5 overflow-x-auto px-4 pb-1" role="tablist" aria-label="Categories">
      {items.map((c) => {
        const on = active === c;
        return (
          <button
            key={c}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onSelect(c)}
            className={cn(
              'shrink-0 whitespace-nowrap rounded-2xl border px-5 py-3 text-[15px] font-semibold transition active:scale-95',
              on ? 'border-tv-ink bg-tv-ink text-tv-ink-fg' : 'border-tv-line bg-tv-card text-tv-muted',
            )}
          >
            {c === 'ALL' ? 'All Channels' : c}
          </button>
        );
      })}
    </div>
  );
}
