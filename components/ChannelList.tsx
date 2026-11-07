import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import type { VerifiedChannel } from '@/types/channel';
import { flagEmoji } from '@/lib/countries';
import { cn } from '@/lib/utils';
import ChannelLogo from './ChannelLogo';

const PAGE = 50;

type Props = {
  channels: VerifiedChannel[];
  emptyText: string;
  activeId?: string;
  isFavorite: (id: string) => boolean;
  onPlay: (c: VerifiedChannel) => void;
  onToggleFavorite: (id: string) => void;
};

/** Phone list of live channels (only ever receives gated channels). */
export default function ChannelList({ channels, emptyText, activeId, isFavorite, onPlay, onToggleFavorite }: Props) {
  const [visible, setVisible] = useState(PAGE);
  useEffect(() => setVisible(PAGE), [channels]);

  if (!channels.length) {
    return <p className="mx-4 rounded-2xl border border-tv-line bg-tv-surface p-4 text-sm text-tv-muted">{emptyText}</p>;
  }
  return (
    <div className="px-4">
      <ul className="divide-y divide-tv-line overflow-hidden rounded-2xl border border-tv-line bg-tv-surface">
        {channels.slice(0, visible).map((c) => {
          const fav = isFavorite(c.id);
          return (
            <li key={c.id} data-channel-id={c.id} className={cn('flex items-center gap-3 pr-2', c.id === activeId && 'bg-tv-soft')}>
              <button type="button" onClick={() => onPlay(c)} aria-label={`Play ${c.name}`} className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-3 text-left active:opacity-70">
                <ChannelLogo channel={c} size="md" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold text-tv-fg">{c.name}</span>
                  <span className="block truncate text-sm text-tv-muted">
                    {flagEmoji(c.country)} {c.countryName} · {c.categories.join(', ')}
                  </span>
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> live
                </span>
              </button>
              <button
                type="button"
                onClick={() => onToggleFavorite(c.id)}
                aria-label={fav ? `Remove ${c.name} from favorites` : `Add ${c.name} to favorites`}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl active:bg-tv-card"
              >
                <Star className={cn('h-5 w-5', fav ? 'fill-amber-400 text-amber-400' : 'text-tv-muted')} />
              </button>
            </li>
          );
        })}
      </ul>
      {visible < channels.length && (
        <button type="button" onClick={() => setVisible((v) => v + PAGE)} className="mt-3 w-full rounded-2xl border border-tv-line bg-tv-card py-3 text-sm font-semibold text-tv-accent">
          Show more ({channels.length - visible} left)
        </button>
      )}
    </div>
  );
}
