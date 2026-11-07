import { vi } from 'vitest';
import type { VerifiedChannel } from '../types/channel';

export type Route = { status?: number; body?: string; cors?: boolean; hang?: boolean; networkError?: boolean };

/** Replaces global fetch with a URL router. Unknown URLs answer 404. */
export function mockFetch(routes: Record<string, Route>) {
  const calls: string[] = [];
  const fn = vi.fn(async (input: unknown, init?: RequestInit): Promise<Response> => {
    const url = String(input);
    calls.push(url);
    const r = routes[url];
    if (!r) return new Response('not found', { status: 404, headers: { 'access-control-allow-origin': '*' } });
    if (r.networkError) throw new TypeError('fetch failed');
    if (r.hang) {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
      });
    }
    const headers: Record<string, string> = r.cors === false ? {} : { 'access-control-allow-origin': '*' };
    return new Response(r.body ?? '', { status: r.status ?? 200, headers });
  });
  vi.stubGlobal('fetch', fn);
  return { fn, calls };
}

/** master playlist -> variant -> first segment, all with CORS */
export function healthyStream(base: string): Record<string, Route> {
  return {
    [`${base}/master.m3u8`]: { body: '#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=800000\nlow/index.m3u8\n' },
    [`${base}/low/index.m3u8`]: { body: '#EXTM3U\n#EXT-X-TARGETDURATION:6\n#EXTINF:6,\nseg1.ts\n' },
    [`${base}/low/seg1.ts`]: { status: 206, body: 'x'.repeat(128) },
  };
}

export function verifiedChannel(over: Partial<VerifiedChannel> = {}): VerifiedChannel {
  const id = over.id ?? 'id1';
  return {
    id,
    name: `Channel ${id}`,
    url: `https://streams.example/${id}/master.m3u8`,
    country: 'US',
    countryName: 'United States',
    categories: ['News'],
    flags: [],
    requiresHeaders: false,
    checkedAt: '2026-11-07T06:00:00.000Z',
    ...over,
  };
}
