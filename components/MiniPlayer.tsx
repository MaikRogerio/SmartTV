import { Cast, ChevronUp, Pause, Play, Square } from 'lucide-react';
import type { VerifiedChannel } from '@/types/channel';
import ChannelLogo from './ChannelLogo';

type Props = { channel: VerifiedChannel; device: string | null; paused: boolean; onTogglePause: () => void; onStop: () => void; onExpand: () => void };

/** Sticky "now casting" bar above the bottom navigation. */
export default function MiniPlayer({ channel, device, paused, onTogglePause, onStop, onExpand }: Props) {
  return (
    <div className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-30">
      <div className="mx-auto max-w-2xl border-t border-tv-line bg-tv-surface/95 backdrop-blur">
        <div className="h-0.5 w-full overflow-hidden bg-tv-accent/15">
          <div className="h-full w-2/3 animate-pulse bg-tv-accent" />
        </div>
        <div className="flex items-center gap-3 px-4 py-2.5">
          <button type="button" onClick={onExpand} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-label="Open TV remote">
            <ChannelLogo channel={channel} size="sm" />
            <span className="min-w-0">
              <span className="flex items-center gap-1.5">
                <span className="truncate text-[15px] font-bold text-tv-fg">{channel.name}</span>
                <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
              </span>
              <span className="flex items-center gap-1 truncate text-sm text-tv-accent">
                <Cast className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">Casting to {device ?? 'TV'}</span>
              </span>
            </span>
          </button>
          <button type="button" onClick={onTogglePause} aria-label={paused ? 'Play' : 'Pause'} className="flex h-11 w-11 items-center justify-center rounded-xl border border-tv-line bg-tv-card text-tv-fg active:scale-95">
            {paused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
          </button>
          <button type="button" onClick={onStop} aria-label="Stop casting" className="flex h-11 w-11 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 active:scale-95 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-400">
            <Square className="h-4 w-4 fill-current" />
          </button>
          <button type="button" onClick={onExpand} aria-label="Open TV remote" className="flex h-11 w-11 items-center justify-center rounded-xl border border-tv-line bg-tv-card text-tv-fg active:scale-95">
            <ChevronUp className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
