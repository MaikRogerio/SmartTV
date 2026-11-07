import { Baby, ChevronLeft, Clapperboard, Film, LayoutGrid, Music, Newspaper, Sparkles, Trophy, Tv } from 'lucide-react';
import type { VerifiedChannel } from '@/types/channel';
import { cn } from '@/lib/utils';
import ChannelList from '../ChannelList';
import SectionHeader from '../SectionHeader';

const ICONS: Record<string, typeof Tv> = {
  News: Newspaper, Sports: Trophy, Movies: Clapperboard, Music, Kids: Baby, Documentary: Film, Entertainment: Sparkles, General: Tv,
};
const TINTS = ['text-sky-500 bg-sky-500/10', 'text-violet-500 bg-violet-500/10', 'text-rose-500 bg-rose-500/10', 'text-emerald-500 bg-emerald-500/10', 'text-amber-500 bg-amber-500/10', 'text-cyan-500 bg-cyan-500/10'];

type Props = {
  channels: VerifiedChannel[];
  categories: Array<[string, number]>;
  selected: string | null;
  onSelect: (c: string | null) => void;
  activeId?: string;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void;
  onPlay: (c: VerifiedChannel, context: VerifiedChannel[]) => void;
};

export default function CategoriesTab(p: Props) {
  if (p.selected) {
    const items = p.channels.filter((c) => c.categories.includes(p.selected!));
    return (
      <div className="pt-4">
        <button type="button" onClick={() => p.onSelect(null)} className="mb-3 ml-3 flex items-center gap-1 rounded-lg px-1 py-1 text-sm font-semibold text-tv-accent">
          <ChevronLeft className="h-4 w-4" /> All categories
        </button>
        <SectionHeader title={p.selected} meta={`${items.length} live`} />
        <ChannelList channels={items} emptyText="No live channels in this category." activeId={p.activeId} isFavorite={p.isFavorite} onPlay={(c) => p.onPlay(c, items)} onToggleFavorite={p.onToggleFavorite} />
      </div>
    );
  }
  return (
    <div className="pt-4">
      <SectionHeader icon={<LayoutGrid className="h-4 w-4" />} title="Categories" meta={`${p.categories.length} groups`} />
      <div className="grid grid-cols-2 gap-3 px-4">
        {p.categories.map(([cat, n], i) => {
          const Icon = ICONS[cat] ?? LayoutGrid;
          return (
            <button key={cat} type="button" onClick={() => p.onSelect(cat)} className="flex flex-col items-start gap-3 rounded-2xl border border-tv-line bg-tv-surface p-4 text-left transition active:scale-[0.98]">
              <span className={cn('flex h-11 w-11 items-center justify-center rounded-xl', TINTS[i % TINTS.length])}>
                <Icon className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-[15px] font-bold text-tv-fg">{cat}</span>
                <span className="block font-mono text-xs text-tv-muted">{n} live</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
