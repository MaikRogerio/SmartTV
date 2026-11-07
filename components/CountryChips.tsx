import { AlertTriangle, Globe } from 'lucide-react';
import type { CoverageRow } from '@/lib/coverage';
import { cn } from '@/lib/utils';

type Props = { rows: CoverageRow[]; total: number; active: string; onSelect: (code: string) => void };

/** "All Countries" + the 13 featured countries. Countries with 0 live channels are flagged in amber. */
export default function CountryChips({ rows, total, active, onSelect }: Props) {
  const base = 'flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-3 text-[15px] font-semibold transition active:scale-95';
  return (
    <div className="no-scrollbar flex gap-2.5 overflow-x-auto px-4 pb-1" role="list" aria-label="Featured countries">
      <button
        type="button"
        role="listitem"
        onClick={() => onSelect('ALL')}
        aria-pressed={active === 'ALL'}
        className={cn(base, active === 'ALL' ? 'border-tv-accent bg-tv-accent text-white shadow-md shadow-tv-accent/25' : 'border-tv-line bg-tv-surface text-tv-fg')}
      >
        <Globe className="h-4 w-4" />
        All Countries
        <span className={cn('rounded-md px-1.5 py-0.5 font-mono text-xs', active === 'ALL' ? 'bg-white/20' : 'bg-tv-card text-tv-muted')}>{total}</span>
      </button>
      {rows.map((r) => {
        const on = active === r.code;
        return (
          <button
            key={r.code}
            type="button"
            role="listitem"
            onClick={() => onSelect(r.code)}
            aria-pressed={on}
            aria-label={`${r.name}: ${r.zero ? 'no live channels' : `${r.online} live channels`}`}
            className={cn(
              base,
              on ? 'border-tv-accent bg-tv-accent text-white shadow-md shadow-tv-accent/25' : 'border-tv-line bg-tv-surface text-tv-fg',
              r.zero && !on && 'border-amber-400/60 text-amber-600 dark:text-amber-300',
            )}
          >
            <span className={cn('font-mono text-xs lowercase', on ? 'text-white/80' : 'text-tv-muted')}>{r.code}</span>
            <span className="whitespace-nowrap">{r.name}</span>
            {r.zero ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <span className={cn('rounded-md px-1.5 py-0.5 font-mono text-xs', on ? 'bg-white/20' : 'bg-tv-card text-tv-muted')}>{r.online}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
