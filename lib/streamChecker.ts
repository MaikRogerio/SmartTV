/**
 * Stream health checker — the app's "internal control" (runs in Node: locally or in the GitHub Action).
 * A channel is only published if its stream can actually be played in a browser / on a Chromecast:
 *   1. URL is HTTPS (an https site cannot load http media: mixed content)
 *   2. No custom Referer / User-Agent needed (browsers cannot set them)
 *   3. Playlist answers 200 and is a real HLS playlist (#EXTM3U)
 *   4. CORS header present (hls.js and the Cast receiver load via XHR/fetch)
 *   5. (deep) variant playlist has segments and the first segment downloads
 */
import type { Channel, CheckResult, StreamStatus } from '../types/channel';

export type CheckOptions = {
  timeoutMs: number;
  deep: boolean;
  requireHttps: boolean;
  requireCors: boolean;
  origin: string;
  retries: number;
};

export const DEFAULT_CHECK_OPTIONS: CheckOptions = {
  timeoutMs: 8000,
  deep: true,
  requireHttps: true,
  requireCors: true,
  origin: 'https://maikrogerio.github.io',
  retries: 1,
};

const UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 SmartTVPlus-HealthCheck';
const MAX_PLAYLIST_BYTES = 256 * 1024;

class CheckFailure extends Error {
  constructor(public status: StreamStatus, reason: string) {
    super(reason);
  }
}

type Fetched = { res: Response; text: string };

/** Fetch with a hard timeout that also covers reading the body (live streams never end). */
async function fetchLimited(
  url: string,
  headers: Record<string, string>,
  timeoutMs: number,
  maxBytes = MAX_PLAYLIST_BYTES,
): Promise<Fetched> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, ...headers },
      signal: ctrl.signal,
      redirect: 'follow',
      cache: 'no-store',
    });
    let text = '';
    if (res.body) {
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let bytes = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        text += dec.decode(value, { stream: true });
        if (bytes >= maxBytes) {
          await reader.cancel().catch(() => undefined);
          break;
        }
      }
    }
    return { res, text };
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw new CheckFailure('offline', 'timeout');
    throw new CheckFailure('offline', `network: ${(e as Error).message}`);
  } finally {
    clearTimeout(timer);
  }
}

function assertCors(res: Response, opts: CheckOptions, what: string) {
  if (!opts.requireCors) return;
  const acao = res.headers.get('access-control-allow-origin');
  if (!acao || (acao !== '*' && acao !== opts.origin)) {
    throw new CheckFailure('unplayable', `no CORS on ${what}`);
  }
}

/** First non-comment URI after a given tag */
function firstUriAfter(playlist: string, tag: string): string | null {
  const lines = playlist.split(/\r?\n/).map((l) => l.trim());
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith(tag)) {
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j] && !lines[j].startsWith('#')) return lines[j];
      }
    }
  }
  return null;
}

async function runCheck(url: string, opts: CheckOptions): Promise<void> {
  const headers = { Origin: opts.origin };

  const top = await fetchLimited(url, headers, opts.timeoutMs);
  if (!top.res.ok) throw new CheckFailure('offline', `HTTP ${top.res.status}`);
  if (!top.text.includes('#EXTM3U')) throw new CheckFailure('unplayable', 'not an HLS playlist');
  assertCors(top.res, opts, 'playlist');
  if (!opts.deep) return;

  let mediaUrl = top.res.url || url;
  let media = top.text;
  if (top.text.includes('#EXT-X-STREAM-INF')) {
    const variant = firstUriAfter(top.text, '#EXT-X-STREAM-INF');
    if (!variant) throw new CheckFailure('offline', 'master playlist has no variants');
    mediaUrl = new URL(variant, top.res.url || url).toString();
    const v = await fetchLimited(mediaUrl, headers, opts.timeoutMs);
    if (!v.res.ok) throw new CheckFailure('offline', `variant HTTP ${v.res.status}`);
    assertCors(v.res, opts, 'variant');
    mediaUrl = v.res.url || mediaUrl;
    media = v.text;
  }
  const segment = firstUriAfter(media, '#EXTINF');
  if (!segment) throw new CheckFailure('offline', 'no video segments');

  const segUrl = new URL(segment, mediaUrl).toString();
  const s = await fetchLimited(segUrl, { ...headers, Range: 'bytes=0-2047' }, opts.timeoutMs, 4096);
  if (!s.res.ok) throw new CheckFailure('offline', `segment HTTP ${s.res.status}`);
  assertCors(s.res, opts, 'segment');
}

export async function checkStream(
  channel: Pick<Channel, 'url' | 'requiresHeaders'>,
  options: Partial<CheckOptions> = {},
): Promise<CheckResult> {
  const opts = { ...DEFAULT_CHECK_OPTIONS, ...options };
  const done = (status: StreamStatus, reason?: string, latencyMs?: number): CheckResult => ({
    status,
    reason,
    latencyMs,
    checkedAt: new Date().toISOString(),
  });

  if (channel.requiresHeaders) return done('unplayable', 'needs custom referrer/user-agent');
  if (opts.requireHttps && !channel.url.toLowerCase().startsWith('https://')) {
    return done('unplayable', 'http stream (blocked as mixed content)');
  }

  let last: CheckFailure | null = null;
  for (let attempt = 0; attempt <= opts.retries; attempt++) {
    const started = Date.now();
    try {
      await runCheck(channel.url, opts);
      return done('online', undefined, Date.now() - started);
    } catch (e) {
      last = e instanceof CheckFailure ? e : new CheckFailure('offline', (e as Error).message);
      if (last.status === 'unplayable') break; // retrying will not fix CORS / format issues
    }
  }
  return done(last?.status ?? 'offline', last?.message);
}

/** Check many channels with bounded concurrency. Results keyed by channel id. */
export async function checkMany<T extends Pick<Channel, 'id' | 'url' | 'requiresHeaders'>>(
  channels: T[],
  options: Partial<CheckOptions> = {},
  concurrency = 24,
  onProgress?: (done: number, total: number, online: number) => void,
): Promise<Map<string, CheckResult>> {
  const results = new Map<string, CheckResult>();
  let next = 0;
  let done = 0;
  let online = 0;

  async function worker() {
    while (next < channels.length) {
      const ch = channels[next++];
      const r = await checkStream(ch, options);
      results.set(ch.id, r);
      done++;
      if (r.status === 'online') online++;
      onProgress?.(done, channels.length, online);
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, Math.min(concurrency, channels.length)) }, worker));
  return results;
}
