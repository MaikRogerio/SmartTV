import { useCallback, useEffect, useRef, useState } from 'react';
import type { VerifiedChannel } from '@/types/channel';
import { castChannel, castContext, castSupport, initCast, type CastSupport } from '@/lib/cast';

export type CastStatus = 'unavailable' | 'no-devices' | 'idle' | 'connecting' | 'connected';

export function useCast() {
  const [support, setSupport] = useState<CastSupport>(() => castSupport());
  const [status, setStatus] = useState<CastStatus>('unavailable');
  const [device, setDevice] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [mediaId, setMediaId] = useState<string | null>(null); // channel id the receiver reports it is playing
  const controller = useRef<cast.framework.RemotePlayerController | null>(null);
  const player = useRef<cast.framework.RemotePlayer | null>(null);

  // wait for the SDK (index.html sets window.__castAvailable and fires "cast-available")
  useEffect(() => {
    const update = () => setSupport(castSupport());
    window.addEventListener('cast-available', update);
    const t = setTimeout(update, 4000); // SDK never answered -> show the right help text
    return () => {
      window.removeEventListener('cast-available', update);
      clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    if (support !== 'ready' || !initCast()) return;
    const ctx = castContext()!;
    const fw = window.cast!.framework;
    const map = (s: string): CastStatus =>
      s === fw.CastState.CONNECTED ? 'connected'
      : s === fw.CastState.CONNECTING ? 'connecting'
      : s === fw.CastState.NO_DEVICES_AVAILABLE ? 'no-devices'
      : 'idle';
    const onState = (e: { castState: string }) => {
      setStatus(map(e.castState));
      setDevice(ctx.getCurrentSession()?.getCastDevice().friendlyName ?? null);
    };
    onState({ castState: ctx.getCastState() });
    ctx.addEventListener(fw.CastContextEventType.CAST_STATE_CHANGED, onState);

    player.current = new fw.RemotePlayer();
    controller.current = new fw.RemotePlayerController(player.current);
    const onPause = () => setPaused(Boolean(player.current?.isPaused));
    controller.current.addEventListener(fw.RemotePlayerEventType.IS_PAUSED_CHANGED, onPause);
    // The receiver is the source of truth for "what is on the TV" (also covers a page reload that re-joins a session).
    const onMedia = () => {
      const p = player.current;
      setMediaId(p?.isConnected ? (p.mediaInfo?.customData?.channelId ?? null) : null);
    };
    controller.current.addEventListener(fw.RemotePlayerEventType.MEDIA_INFO_CHANGED, onMedia);
    controller.current.addEventListener(fw.RemotePlayerEventType.IS_CONNECTED_CHANGED, onMedia);
    onMedia();
    return () => {
      ctx.removeEventListener(fw.CastContextEventType.CAST_STATE_CHANGED, onState);
      controller.current?.removeEventListener(fw.RemotePlayerEventType.IS_PAUSED_CHANGED, onPause);
      controller.current?.removeEventListener(fw.RemotePlayerEventType.MEDIA_INFO_CHANGED, onMedia);
      controller.current?.removeEventListener(fw.RemotePlayerEventType.IS_CONNECTED_CHANGED, onMedia);
    };
  }, [support]);

  /** Opens Chrome's device picker. Must be called from a tap. */
  const connect = useCallback(async () => {
    try {
      await castContext()?.requestSession();
      return true;
    } catch {
      return false; // user closed the picker
    }
  }, []);

  const load = useCallback((c: VerifiedChannel) => castChannel(c), []);
  const stop = useCallback(() => castContext()?.endCurrentSession(true), []);
  const togglePause = useCallback(() => controller.current?.playOrPause(), []);

  return { support, status, device, paused, mediaId, connect, load, stop, togglePause };
}
