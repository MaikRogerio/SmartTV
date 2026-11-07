import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { VerifiedChannel } from '@/types/channel';
import { useCatalog } from '@/hooks/useCatalog';
import { useLibrary } from '@/hooks/useLibrary';
import { useCast } from '@/hooks/useCast';
import { useTheme } from '@/hooks/useTheme';
import { visibleChannels } from '@/lib/verified';
import { featuredCoverage, zeroCountries } from '@/lib/coverage';
import { FEATURED_COUNTRIES } from '@/lib/featured-countries';
import { CAST_HELP } from '@/lib/cast';
import AppHeader from '@/components/AppHeader';
import BottomNav, { type Tab } from '@/components/BottomNav';
import MiniPlayer from '@/components/MiniPlayer';
import VideoPlayer from '@/components/VideoPlayer';
import CastPill from '@/components/CastPill';
import ExploreTab from '@/components/tabs/ExploreTab';
import CategoriesTab from '@/components/tabs/CategoriesTab';
import RemoteTab from '@/components/tabs/RemoteTab';
import FavoritesTab from '@/components/tabs/FavoritesTab';
import DevicesTab from '@/components/tabs/DevicesTab';

const CATEGORY_ORDER = ['News', 'Sports', 'Movies', 'Entertainment', 'Kids', 'Music', 'Documentary', 'General'];

export default function App({ catalogUrl }: { catalogUrl?: string } = {}) {
  const { catalog, channels: verified, loading, error, reload } = useCatalog(catalogUrl);
  const lib = useLibrary();
  const cast = useCast();
  const theme = useTheme();

  const [tab, setTab] = useState<Tab>('explore');
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('ALL');
  const [category, setCategory] = useState('ALL');
  const [catTab, setCatTab] = useState<string | null>(null);
  const [playing, setPlaying] = useState<VerifiedChannel | null>(null); // full-screen on the phone
  const [casting, setCasting] = useState<VerifiedChannel | null>(null); // on the Chromecast
  const [castError, setCastError] = useState<string | null>(null);
  const [queue, setQueue] = useState<VerifiedChannel[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  const flash = useCallback((msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  // Rule 1: everything below derives from gated channels minus the ones that failed on this device.
  const channels = useMemo(() => visibleChannels(verified, lib.failed), [verified, lib.failed]);
  const byId = useMemo(() => new Map(channels.map((c) => [c.id, c])), [channels]);
  const resolve = useCallback((ids: string[]) => ids.map((id) => byId.get(id)).filter((c): c is VerifiedChannel => Boolean(c)), [byId]);

  const featured = useMemo(() => featuredCoverage(FEATURED_COUNTRIES, channels, catalog?.coverage), [channels, catalog]);
  const zero = useMemo(() => (catalog ? zeroCountries(featured) : []), [catalog, featured]);
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    channels.forEach((c) => c.categories.forEach((k) => counts.set(k, (counts.get(k) ?? 0) + 1)));
    const rank = (k: string) => (CATEGORY_ORDER.includes(k) ? CATEGORY_ORDER.indexOf(k) : 99);
    return [...counts.entries()].sort((a, b) => rank(a[0]) - rank(b[0]) || b[1] - a[1]);
  }, [channels]);
  const recent = useMemo(() => resolve(lib.recent).slice(0, 10), [resolve, lib.recent]);
  const favorites = useMemo(() => resolve(lib.favorites), [resolve, lib.favorites]);

  const sendToCast = useCallback(
    (c: VerifiedChannel) => {
      setCasting(c);
      setCastError(null);
      cast.load(c).catch(() => setCastError(`The Chromecast could not play ${c.name}. Try the next channel.`));
    },
    [cast],
  );

  const play = useCallback(
    (c: VerifiedChannel, context: VerifiedChannel[]) => {
      setQueue(context);
      lib.addRecent(c.id);
      if (cast.status === 'connected') {
        sendToCast(c);
        flash(`Now on ${cast.device ?? 'TV'}: ${c.name}`);
      } else setPlaying(c);
    },
    [cast.status, cast.device, lib, sendToCast, flash],
  );

  // Connect while watching on the phone -> hand the channel to the TV. Disconnect -> clear the cast state.
  const castStatus = cast.status;
  const prevStatus = useRef(castStatus);
  useEffect(() => {
    const was = prevStatus.current;
    prevStatus.current = castStatus;
    if (castStatus === 'connected' && was !== 'connected' && playing) {
      sendToCast(playing);
      setPlaying(null);
      setTab('remote');
    }
    if (castStatus !== 'connected' && was === 'connected' && casting) {
      setCasting(null);
      flash('Casting stopped.');
    }
  }, [castStatus, playing, casting, sendToCast, flash]);

  const current = casting ?? playing;
  const step = useCallback(
    (delta: 1 | -1) => {
      if (!current) return;
      const live = (queue.length ? queue : channels).filter((c) => byId.has(c.id));
      if (!live.length) return;
      const i = live.findIndex((c) => c.id === current.id);
      const next = live[(i + delta + live.length) % live.length];
      lib.addRecent(next.id);
      if (casting) sendToCast(next);
      else setPlaying(next);
    },
    [current, queue, channels, byId, lib, casting, sendToCast],
  );
  const next = useCallback(() => step(1), [step]);
  const prev = useCallback(() => step(-1), [step]);

  const stopCasting = useCallback(() => {
    cast.stop();
    setCasting(null);
  }, [cast]);

  const onUnavailable = useCallback(
    (c: VerifiedChannel) => {
      lib.hideFailed(c.id);
      flash(`“${c.name}” did not start on this device and was hidden.`);
    },
    [lib, flash],
  );

  const goTab = useCallback((t: Tab) => {
    setTab(t);
    window.scrollTo?.({ top: 0 });
  }, []);

  const upNext = useMemo(() => {
    if (!casting) return [];
    const live = (queue.length ? queue : channels).filter((c) => byId.has(c.id));
    const i = live.findIndex((c) => c.id === casting.id);
    return [...live.slice(i + 1), ...live.slice(0, Math.max(0, i))].slice(0, 8);
  }, [casting, queue, channels, byId]);

  const phoneOnly = cast.support === 'ios' || cast.support === 'unsupported-browser';
  const castInfo = { support: cast.support, status: cast.status, device: cast.device };
  const connect = () => void cast.connect();
  const activeId = current?.id;

  return (
    <div className="min-h-[100dvh] bg-tv-bg text-tv-fg">
      <AppHeader theme={theme.theme} onToggleTheme={theme.toggle} cast={castInfo} onCastPill={() => (cast.status === 'idle' ? connect() : goTab('devices'))} onHome={() => goTab('explore')} />

      <main className={casting ? 'mx-auto max-w-2xl pb-44' : 'mx-auto max-w-2xl pb-28'}>
        {tab === 'explore' && (
          <ExploreTab
            channels={channels}
            loading={loading}
            error={error}
            onRetry={() => void reload()}
            query={query}
            onQuery={setQuery}
            country={country}
            onCountry={setCountry}
            category={category}
            onCategory={setCategory}
            featured={featured}
            zero={zero}
            categories={categories.map(([c]) => c)}
            recent={recent}
            activeId={activeId}
            casting={Boolean(casting)}
            cast={castInfo}
            onConnect={connect}
            onManage={() => goTab('devices')}
            isFavorite={lib.isFavorite}
            onToggleFavorite={lib.toggleFavorite}
            onPlay={play}
          />
        )}
        {tab === 'categories' && (
          <CategoriesTab channels={channels} categories={categories} selected={catTab} onSelect={setCatTab} activeId={activeId} isFavorite={lib.isFavorite} onToggleFavorite={lib.toggleFavorite} onPlay={play} />
        )}
        {tab === 'remote' && (
          <RemoteTab
            cast={{ ...castInfo, paused: cast.paused }}
            casting={casting}
            castError={castError}
            upNext={upNext}
            favorite={casting ? lib.isFavorite(casting.id) : false}
            onConnect={connect}
            onTogglePause={cast.togglePause}
            onNext={next}
            onPrev={prev}
            onStop={stopCasting}
            onToggleFavorite={lib.toggleFavorite}
            isFavorite={lib.isFavorite}
            onPlay={play}
            onBrowse={() => goTab('explore')}
          />
        )}
        {tab === 'favorites' && <FavoritesTab favorites={favorites} activeId={activeId} isFavorite={lib.isFavorite} onToggleFavorite={lib.toggleFavorite} onPlay={play} />}
        {tab === 'devices' && (
          <DevicesTab
            cast={castInfo}
            onConnect={connect}
            onDisconnect={stopCasting}
            catalog={catalog}
            shown={channels.length}
            hiddenOnDevice={verified.length - channels.length}
            onResetHidden={lib.resetFailed}
            featured={featured}
            themePref={theme.pref}
            onThemePref={theme.setPref}
          />
        )}
      </main>

      {toast && (
        <div role="status" className="fixed inset-x-4 bottom-[calc(9.5rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-sm rounded-2xl bg-tv-ink px-4 py-3 text-center text-sm font-semibold text-tv-ink-fg shadow-lg">
          {toast}
        </div>
      )}

      {casting && tab !== 'remote' && (
        <MiniPlayer channel={casting} device={cast.device} paused={cast.paused} onTogglePause={cast.togglePause} onStop={stopCasting} onExpand={() => goTab('remote')} />
      )}

      <BottomNav tab={tab} onChange={goTab} favoritesCount={favorites.length} castConnected={cast.status === 'connected'} />

      {playing && (
        <VideoPlayer
          key={playing.id}
          channel={playing}
          favorite={lib.isFavorite(playing.id)}
          onToggleFavorite={lib.toggleFavorite}
          onClose={() => setPlaying(null)}
          onNext={next}
          onPrev={prev}
          onUnavailable={onUnavailable}
          castSlot={phoneOnly ? null : <CastPill support={cast.support} status={cast.status} device={cast.device} onClick={connect} />}
          castNote={phoneOnly ? CAST_HELP[cast.support as 'ios' | 'unsupported-browser'] : null}
        />
      )}
    </div>
  );
}
