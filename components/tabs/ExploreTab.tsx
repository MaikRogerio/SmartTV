import { AlertTriangle, Clock, Globe2, Loader2, Radio } from 'lucide-react';
import type { VerifiedChannel } from '@/types/channel';
import type { CoverageRow } from '@/lib/coverage';
import type { CastStatus } from '@/hooks/useCast';
import type { CastSupport } from '@/lib/cast';
import { countryName } from '@/lib/countries';
import SearchBar from '../SearchBar';
import CastStatusCard from '../CastStatusCard';
import SectionHeader from '../SectionHeader';
import CountryChips from '../CountryChips';
import CategoryPills from '../CategoryPills';
import ContinueWatching from '../ContinueWatching';
import ChannelList from '../ChannelList';

type Props = {
  /** Gated + locally filtered channels only (Rule 1). */
  channels: VerifiedChannel[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  query: string;
  onQuery: (q: string) => void;
  country: string;
  onCountry: (c: string) => void;
  category: string;
  onCategory: (c: string) => void;
  featured: CoverageRow[];
  zero: string[];
  categories: string[];
  recent: VerifiedChannel[];
  activeId?: string;
  casting: boolean;
  cast: { support: CastSupport; status: CastStatus; device: string | null };
  onConnect: () => void;
  onManage: () => void;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void;
  onPlay: (c: VerifiedChannel, context: VerifiedChannel[]) => void;
};

export default function ExploreTab(p: Props) {
  const q = p.query.trim().toLowerCase();
  const results = q
    ? p.channels.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.countryName.toLowerCase().includes(q) ||
          c.country.toLowerCase() === q ||
          c.categories.some((k) => k.toLowerCase().includes(q)),
      )
    : [];
  const filtered = p.channels.filter(
    (c) => (p.country === 'ALL' || c.country === p.country) && (p.category === 'ALL' || c.categories.includes(p.category)),
  );
  const listTitle = [p.country === 'ALL' ? 'All countries' : countryName(p.country), p.category === 'ALL' ? null : p.category].filter(Boolean).join(' · ');

  return (
    <div className="space-y-6 pt-4">
      <SearchBar value={p.query} onChange={p.onQuery} total={p.channels.length} />

      {p.error && (
        <div role="alert" className="mx-4 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          Could not load the verified channel list ({p.error}). No channels are shown until it loads.{' '}
          <button type="button" className="font-semibold underline" onClick={p.onRetry}>Try again</button>
        </div>
      )}
      {p.loading && (
        <div className="flex items-center gap-2 px-4 text-sm text-tv-muted">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading verified channels…
        </div>
      )}

      {q ? (
        <section>
          <SectionHeader title={`Results for “${p.query.trim()}”`} meta={`${results.length} live`} />
          <ChannelList channels={results} emptyText="No live channel matches your search." activeId={p.activeId} isFavorite={p.isFavorite} onPlay={(c) => p.onPlay(c, results)} onToggleFavorite={p.onToggleFavorite} />
        </section>
      ) : (
        <>
          <CastStatusCard support={p.cast.support} status={p.cast.status} device={p.cast.device} onConnect={p.onConnect} onManage={p.onManage} />

          <section>
            <SectionHeader icon={<Globe2 className="h-4 w-4" />} title="Featured Countries" meta={`${p.featured.length} countries`} />
            <CountryChips rows={p.featured} total={p.channels.length} active={p.country} onSelect={p.onCountry} />
            {!p.loading && !p.error && p.zero.length > 0 && (
              <p role="status" className="mx-4 mt-3 flex items-start gap-2 rounded-xl border border-amber-300/60 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{`No live channels right now for: ${p.zero.join(', ')}.`}</span>
              </p>
            )}
          </section>

          <CategoryPills categories={p.categories} active={p.category} onSelect={p.onCategory} />

          {p.recent.length > 0 && (
            <section>
              <SectionHeader icon={<Clock className="h-4 w-4" />} title="Continue Watching" meta={`${p.recent.length} Recent`} />
              <ContinueWatching channels={p.recent} activeId={p.activeId} casting={p.casting} onPlay={(c) => p.onPlay(c, p.recent)} />
            </section>
          )}

          <section>
            <SectionHeader icon={<Radio className="h-4 w-4" />} title={listTitle} meta={`${filtered.length} live`} />
            <ChannelList
              channels={filtered}
              emptyText={p.country !== 'ALL' ? 'No live channels for this selection right now. The next check (every 6 hours) may add some.' : 'No live channels in this category.'}
              activeId={p.activeId}
              isFavorite={p.isFavorite}
              onPlay={(c) => p.onPlay(c, filtered)}
              onToggleFavorite={p.onToggleFavorite}
            />
          </section>
        </>
      )}
    </div>
  );
}
