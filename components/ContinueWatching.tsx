import { Cast, Play } from 'lucide-react';
import type { VerifiedChannel } from '@/types/channel';
import { flagEmoji } from '@/lib/countries';
import { cn } from '@/lib/utils';
import ChannelLogo from './ChannelLogo';

type Props = { channels: VerifiedChannel[]; activeId?: string; casting: boolean; onPlay: (c: VerifiedChannel) => void };

export default function ContinueWatching({ channels, activeId, casting, onPlay }: Props) {
  return (
    <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto px-4 pb-1">
      {channels.map((c) => {
        const active = c.id === activeId;
        return (
          <button
            key={c.id}
            type="button"
            data-channel-id={c.id}
            onClick={() => onPlay(c)}
            aria-label={`Play ${c.name}`}
            className={cn(
              'w-60 shrink-0 snap-start rounded-2xl border p-4 text-left transition active:scale-[0.98]',
              active ? 'border-tv-accent bg-tv-soft' : 'border-tv-line bg-tv-surface',
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <ChannelLogo channel={c} size="lg" />
              {active ? (
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-tv-accent px-3 py-2 text-sm font-bold text-white">
                  {casting ? <Cast className="h-4 w-4" /> : <Play className="h-4 w-4" />} Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-lg bg-tv-card px-2 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live
                </span>
              )}
            </div>
            <div className="mt-3 truncate text-[15px] font-bold text-tv-fg">{c.name}</div>
            <div className="truncate text-sm text-tv-muted">
              {flagEmoji(c.country)} {c.countryName} · {c.categories[0]}
            </div>
          </button>
        );
      })}
    </div>
  );
}
