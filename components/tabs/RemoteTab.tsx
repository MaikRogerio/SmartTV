import { Cast, Pause, Play, SkipBack, SkipForward, Smartphone, Square, Star } from 'lucide-react';
import type { VerifiedChannel } from '@/types/channel';
import type { CastStatus } from '@/hooks/useCast';
import { CAST_HELP, type CastSupport } from '@/lib/cast';
import { flagEmoji } from '@/lib/countries';
import { cn } from '@/lib/utils';
import ChannelLogo from '../ChannelLogo';
import ChannelList from '../ChannelList';
import SectionHeader from '../SectionHeader';

type Props = {
  cast: { support: CastSupport; status: CastStatus; device: string | null; paused: boolean };
  casting: VerifiedChannel | null;
  castError: string | null;
  upNext: VerifiedChannel[];
  favorite: boolean;
  onConnect: () => void;
  onTogglePause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onStop: () => void;
  onToggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  onPlay: (c: VerifiedChannel, context: VerifiedChannel[]) => void;
  onBrowse: () => void;
};

/** The phone as the TV remote while casting. */
export default function RemoteTab(p: Props) {
  const phoneOnly = p.cast.support === 'ios' || p.cast.support === 'unsupported-browser';
  const round = 'flex items-center justify-center rounded-full border border-tv-line bg-tv-card text-tv-fg transition active:scale-95';

  if (!p.casting) {
    return (
      <div className="flex flex-col items-center gap-4 px-6 pt-16 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-tv-soft text-tv-accent">
          {phoneOnly ? <Smartphone className="h-9 w-9" /> : <Cast className="h-9 w-9" />}
        </span>
        <h2 className="text-xl font-bold text-tv-fg">
          {phoneOnly ? 'Remote needs a Chromecast' : p.cast.status === 'connected' ? `Connected to ${p.cast.device ?? 'TV'}` : 'Nothing on the TV yet'}
        </h2>
        <p className="max-w-xs text-sm text-tv-muted">
          {phoneOnly
            ? CAST_HELP[p.cast.support as 'ios' | 'unsupported-browser']
            : p.cast.status === 'connected'
              ? 'Pick any channel and it starts on the TV. Controls appear here.'
              : 'Connect to a Chromecast, then pick a channel. This tab becomes your remote.'}
        </p>
        {!phoneOnly && p.cast.status !== 'connected' && (
          <button type="button" onClick={p.onConnect} className="rounded-2xl bg-tv-accent px-6 py-3 font-bold text-tv-accent-fg">Connect to TV</button>
        )}
        <button type="button" onClick={p.onBrowse} className="rounded-2xl border border-tv-line bg-tv-card px-6 py-3 font-semibold text-tv-fg">Browse channels</button>
      </div>
    );
  }

  const c = p.casting;
  return (
    <div className="space-y-6 pt-6">
      <div className="mx-4 flex flex-col items-center gap-4 rounded-3xl border border-tv-accent/30 bg-gradient-to-b from-tv-soft to-tv-surface p-6 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-tv-accent/15 px-3 py-1 text-xs font-bold text-tv-accent">
          <Cast className="h-3.5 w-3.5" /> Casting to {p.cast.device ?? 'TV'}
        </span>
        <ChannelLogo channel={c} size="xl" />
        <div>
          <div className="text-2xl font-extrabold text-tv-fg">{c.name}</div>
          <div className="text-sm text-tv-muted">{flagEmoji(c.country)} {c.countryName} · {c.categories.join(', ')}</div>
        </div>
        {p.castError && <p role="alert" className="rounded-xl bg-rose-500/10 px-4 py-2 text-sm text-rose-600 dark:text-rose-300">{p.castError}</p>}
        <div className="flex items-center gap-5">
          <button type="button" className={cn(round, 'h-14 w-14')} onClick={p.onPrev} aria-label="Previous channel"><SkipBack className="h-6 w-6" /></button>
          <button type="button" className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-tv-accent to-tv-purple text-white shadow-lg shadow-tv-accent/30 active:scale-95" onClick={p.onTogglePause} aria-label={p.cast.paused ? 'Play' : 'Pause'}>
            {p.cast.paused ? <Play className="h-8 w-8" /> : <Pause className="h-8 w-8" />}
          </button>
          <button type="button" className={cn(round, 'h-14 w-14')} onClick={p.onNext} aria-label="Next channel"><SkipForward className="h-6 w-6" /></button>
        </div>
        <div className="flex gap-3">
          <button type="button" className={cn(round, 'gap-2 whitespace-nowrap px-4 py-3 text-sm font-semibold')} onClick={() => p.onToggleFavorite(c.id)}>
            <Star className={cn('h-5 w-5', p.favorite && 'fill-amber-400 text-amber-400')} /> Favorite
          </button>
          <button type="button" className="flex items-center gap-2 whitespace-nowrap rounded-full border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 active:scale-95 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300" onClick={p.onStop}>
            <Square className="h-4 w-4 fill-current" /> Stop casting
          </button>
        </div>
      </div>

      {p.upNext.length > 0 && (
        <section>
          <SectionHeader title="Up next" meta={`${p.upNext.length} live`} />
          <ChannelList channels={p.upNext} emptyText="" isFavorite={p.isFavorite} onPlay={(ch) => p.onPlay(ch, p.upNext)} onToggleFavorite={p.onToggleFavorite} />
        </section>
      )}
    </div>
  );
}
