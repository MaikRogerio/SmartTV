import { useCallback, useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { ChevronDown, Loader2, Maximize, Pause, Play, SkipBack, SkipForward, Star, Volume2, VolumeX } from 'lucide-react';
import type { VerifiedChannel } from '@/types/channel';
import { flagEmoji } from '@/lib/countries';
import { cn } from '@/lib/utils';

export const STARTUP_TIMEOUT_MS = 15_000;
const HIDE_CONTROLS_MS = 4_000;

type Props = {
  channel: VerifiedChannel;
  favorite: boolean;
  onToggleFavorite: (id: string) => void;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  /** stream never started -> caller hides it on this device */
  onUnavailable: (c: VerifiedChannel, reason: string) => void;
  /** cast button (rendered top-right) */
  castSlot?: React.ReactNode;
  /** shown under the title when casting is not possible (iPhone / non-Chrome) */
  castNote?: string | null;
};

type State = 'loading' | 'playing' | 'error';

/** Full-screen playback on the phone (always dark). Keys: Space pause · M mute · F full screen · ←/→ channel · Esc close. */
export default function VideoPlayer(props: Props) {
  const { channel, favorite, onToggleFavorite, onClose, onNext, onPrev, castSlot, castNote } = props;
  const videoRef = useRef<HTMLVideoElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<State>('loading');
  const [errorText, setErrorText] = useState('');
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [controls, setControls] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  const cb = useRef(props.onUnavailable);
  cb.current = props.onUnavailable;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    setState('loading');
    setPaused(false);
    let hls: Hls | null = null;
    let started = false;
    let finished = false;
    let mediaRecoveries = 0;

    const startupTimer = setTimeout(() => fail('stream did not start within 15 s'), STARTUP_TIMEOUT_MS);

    function onStarted() {
      if (started) return;
      started = true;
      clearTimeout(startupTimer);
      setState('playing');
    }
    function fail(reason: string) {
      if (finished) return;
      finished = true;
      clearTimeout(startupTimer);
      setErrorText(reason);
      setState('error');
      // Only channels that never started are hidden. A drop mid-stream gets Retry instead.
      if (!started) cb.current(channel, reason);
    }
    const tryPlay = () =>
      video.play().catch(() => {
        video.muted = true; // autoplay with sound blocked -> start muted
        setMuted(true);
        video.play().catch(() => undefined);
      });

    video.addEventListener('playing', onStarted);

    if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: true, lowLatencyMode: true, manifestLoadingMaxRetry: 1, levelLoadingMaxRetry: 1 });
      hls.on(Hls.Events.MANIFEST_PARSED, tryPlay);
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (!data.fatal) return;
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR && mediaRecoveries < 1) {
          mediaRecoveries++;
          hls?.recoverMediaError();
          return;
        }
        fail(`${data.type}: ${data.details}`);
      });
      hls.loadSource(channel.url);
      hls.attachMedia(video);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = channel.url; // iPhone Safari: native HLS
      video.addEventListener('loadedmetadata', tryPlay, { once: true });
      video.addEventListener('error', () => fail('native playback error'), { once: true });
    } else {
      clearTimeout(startupTimer);
      finished = true;
      setErrorText('This browser cannot play HLS streams');
      setState('error'); // browser problem, not the channel's -> do not hide
    }

    return () => {
      finished = true;
      clearTimeout(startupTimer);
      video.removeEventListener('playing', onStarted);
      hls?.destroy();
      video.removeAttribute('src');
      video.load();
    };
  }, [channel, attempt]);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { void v.play(); setPaused(false); } else { v.pause(); setPaused(true); }
  }, []);
  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }, []);
  const toggleFullscreen = useCallback(() => {
    const v = videoRef.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    if (document.fullscreenElement) void document.exitFullscreen();
    else if (boxRef.current?.requestFullscreen) void boxRef.current.requestFullscreen().catch(() => undefined);
    else v?.webkitEnterFullscreen?.(); // iPhone
  }, []);

  const wake = useCallback(() => {
    setControls(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControls(false), HIDE_CONTROLS_MS);
  }, []);
  useEffect(() => { wake(); return () => clearTimeout(hideTimer.current); }, [wake]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      wake();
      const k = e.key.toLowerCase();
      if (e.key === 'Escape' && !document.fullscreenElement) onClose();
      else if (e.key === ' ') { e.preventDefault(); togglePlay(); }
      else if (k === 'm') toggleMute();
      else if (k === 'f') toggleFullscreen();
      else if (e.key === 'ArrowRight') onNext();
      else if (e.key === 'ArrowLeft') onPrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onNext, onPrev, togglePlay, toggleMute, toggleFullscreen, wake]);

  const btn = 'flex items-center justify-center rounded-full bg-white/10 p-3.5 text-white backdrop-blur transition active:scale-95 hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400';

  return (
    <div ref={boxRef} className="fixed inset-0 z-50 bg-black" onPointerMove={wake} onClick={wake} role="dialog" aria-label={`Playing ${channel.name}`}>
      <video ref={videoRef} className="h-full w-full object-contain" playsInline />

      {state === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-sky-400" />
        </div>
      )}

      {state === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/85 px-6 text-center">
          <p className="text-xl font-bold text-white">Stream unavailable</p>
          <p className="max-w-md text-sm text-white/70">{errorText}. It has been hidden on this device.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" className={btn + ' px-5 text-sm font-semibold'} onClick={() => setAttempt((a) => a + 1)}>Retry</button>
            <button type="button" className={btn + ' px-5 text-sm font-semibold'} onClick={onNext}>Next channel</button>
            <button type="button" className={btn + ' px-5 text-sm font-semibold'} onClick={onClose}>Back</button>
          </div>
        </div>
      )}

      <div className={cn('pointer-events-none absolute inset-0 flex flex-col justify-between transition-opacity duration-300', controls || state !== 'playing' ? 'opacity-100' : 'opacity-0')}>
        <div className="pointer-events-auto flex items-center gap-3 bg-gradient-to-b from-black/85 to-transparent p-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <button type="button" className={btn + ' p-2.5'} onClick={onClose} aria-label="Close player"><ChevronDown className="h-6 w-6" /></button>
          <span className="text-2xl" aria-hidden>{flagEmoji(channel.country)}</span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-lg font-bold text-white">{channel.name}</div>
            <div className="truncate text-sm text-white/70">{castNote ?? `${channel.countryName} · ${channel.categories.join(', ')}`}</div>
          </div>
          {castSlot}
        </div>
        <div className="pointer-events-auto flex items-center justify-center gap-3 bg-gradient-to-t from-black/85 to-transparent p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <button type="button" className={btn} onClick={onPrev} aria-label="Previous channel"><SkipBack className="h-6 w-6" /></button>
          <button type="button" className={btn} onClick={togglePlay} aria-label={paused ? 'Play' : 'Pause'}>
            {paused ? <Play className="h-6 w-6" /> : <Pause className="h-6 w-6" />}
          </button>
          <button type="button" className={btn} onClick={onNext} aria-label="Next channel"><SkipForward className="h-6 w-6" /></button>
          <button type="button" className={btn} onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>
            {muted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
          </button>
          <button type="button" className={btn} onClick={() => onToggleFavorite(channel.id)} aria-label="Toggle favorite">
            <Star className={cn('h-6 w-6', favorite && 'fill-amber-400 text-amber-400')} />
          </button>
          <button type="button" className={btn} onClick={toggleFullscreen} aria-label="Full screen"><Maximize className="h-6 w-6" /></button>
        </div>
      </div>
    </div>
  );
}
