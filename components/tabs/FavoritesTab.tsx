import { Star } from 'lucide-react';
import type { VerifiedChannel } from '@/types/channel';
import ChannelList from '../ChannelList';
import SectionHeader from '../SectionHeader';

type Props = {
  favorites: VerifiedChannel[];
  activeId?: string;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void;
  onPlay: (c: VerifiedChannel, context: VerifiedChannel[]) => void;
};

export default function FavoritesTab(p: Props) {
  return (
    <div className="pt-4">
      <SectionHeader icon={<Star className="h-4 w-4" />} title="Favorites" meta={`${p.favorites.length} live`} />
      <ChannelList
        channels={p.favorites}
        emptyText="Tap ☆ on any channel to keep it here. Favorites that are offline right now are hidden until they pass the check again."
        activeId={p.activeId}
        isFavorite={p.isFavorite}
        onPlay={(c) => p.onPlay(c, p.favorites)}
        onToggleFavorite={p.onToggleFavorite}
      />
    </div>
  );
}
