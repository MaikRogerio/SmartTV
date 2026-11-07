import { Compass, LayoutGrid, MonitorSmartphone, SlidersVertical, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Tab = 'explore' | 'categories' | 'remote' | 'favorites' | 'devices';

const ITEMS: Array<{ id: Tab; label: string; Icon: typeof Compass }> = [
  { id: 'explore', label: 'Explore', Icon: Compass },
  { id: 'categories', label: 'Categories', Icon: LayoutGrid },
  { id: 'remote', label: 'TV Remote', Icon: SlidersVertical },
  { id: 'favorites', label: 'Favorites', Icon: Star },
  { id: 'devices', label: 'Devices', Icon: MonitorSmartphone },
];

type Props = { tab: Tab; onChange: (t: Tab) => void; favoritesCount: number; castConnected: boolean };

export default function BottomNav({ tab, onChange, favoritesCount, castConnected }: Props) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-tv-line bg-tv-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur" aria-label="Main">
      <div className="mx-auto grid h-[4.25rem] max-w-2xl grid-cols-5">
        {ITEMS.map(({ id, label, Icon }) => {
          const on = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              aria-current={on ? 'page' : undefined}
              aria-label={id === 'favorites' && favoritesCount > 0 ? `${label} (${favoritesCount})` : id === 'remote' && castConnected ? `${label} (connected)` : label}
              className={cn('relative flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold', on ? 'text-tv-accent' : 'text-tv-muted')}
            >
              <span className="relative">
                <Icon className="h-6 w-6" strokeWidth={on ? 2.25 : 1.75} />
                {id === 'remote' && castConnected && <span className="absolute -right-1.5 -top-1 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-tv-surface" />}
                {id === 'favorites' && favoritesCount > 0 && (
                  <span aria-hidden className="absolute -right-3 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-extrabold text-amber-950 ring-2 ring-tv-surface">
                    {favoritesCount > 99 ? '99+' : favoritesCount}
                  </span>
                )}
              </span>
              <span className="whitespace-nowrap">{label}</span>
              <span className={cn('h-1 w-1 rounded-full', on ? 'bg-tv-accent' : 'bg-transparent')} />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
