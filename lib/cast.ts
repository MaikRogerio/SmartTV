/** Thin wrapper over the Cast Web Sender. Browser-only; every function is safe to call when the SDK is missing. */
import type { VerifiedChannel } from '../types/channel';

export type CastSupport = 'ready' | 'loading' | 'ios' | 'unsupported-browser';

export function castSupport(): CastSupport {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return 'unsupported-browser';
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
  if (ios) return 'ios';
  if (window.__castAvailable && window.cast?.framework && window.chrome?.cast) return 'ready';
  // The SDK only reports "available" in Chrome (Android / desktop)
  const chromium = /Chrome\//.test(ua) && !/Edg\/|OPR\/|SamsungBrowser/.test(ua);
  return chromium && window.__castAvailable !== false ? 'loading' : 'unsupported-browser';
}

export const CAST_HELP: Record<Exclude<CastSupport, 'ready' | 'loading'>, string> = {
  ios: 'Casting is not supported on iPhone or iPad. Channels play on this device.',
  'unsupported-browser': 'Casting needs Google Chrome (Android or computer) on the same Wi-Fi as the Chromecast.',
};

let initialised = false;
export function initCast(): boolean {
  if (initialised) return true;
  if (castSupport() !== 'ready') return false;
  const { cast, chrome } = window;
  cast!.framework.CastContext.getInstance().setOptions({
    receiverApplicationId: chrome!.cast!.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
    autoJoinPolicy: chrome!.cast!.AutoJoinPolicy.ORIGIN_SCOPED,
  });
  initialised = true;
  return true;
}

export const castContext = () => (initialised ? window.cast!.framework.CastContext.getInstance() : null);

/** Sends a verified HLS channel to the Default Media Receiver on the connected Chromecast. */
export async function castChannel(channel: VerifiedChannel): Promise<void> {
  const session = castContext()?.getCurrentSession();
  if (!session) throw new Error('No Chromecast connected');
  const media = window.chrome!.cast!.media;
  const info = new media.MediaInfo(channel.url, 'application/x-mpegURL');
  info.contentUrl = channel.url;
  info.streamType = media.StreamType.LIVE;
  const meta = new media.GenericMediaMetadata();
  meta.title = channel.name;
  meta.subtitle = `${channel.countryName} · ${channel.categories.join(', ')}`;
  if (channel.logo?.startsWith('https://')) meta.images = [new window.chrome!.cast!.Image(channel.logo)];
  info.metadata = meta;
  const request = new media.LoadRequest(info);
  request.autoplay = true;
  const err = await session.loadMedia(request);
  if (err) throw new Error(String(err));
}
