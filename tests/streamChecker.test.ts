import { describe, expect, it } from 'vitest';
import { checkMany, checkStream } from '../lib/streamChecker';
import { healthyStream, mockFetch } from './helpers';

const B = 'https://s.example/ch';
const ch = (url = `${B}/master.m3u8`, requiresHeaders = false) => ({ url, requiresHeaders });
const fast = { timeoutMs: 200, retries: 0 };

describe('checkStream', () => {
  it('online: master -> variant -> first segment, all with CORS', async () => {
    const { calls } = mockFetch(healthyStream(B));
    const r = await checkStream(ch(), fast);
    expect(r.status).toBe('online');
    expect(calls).toEqual([`${B}/master.m3u8`, `${B}/low/index.m3u8`, `${B}/low/seg1.ts`]);
    expect(Number.isFinite(Date.parse(r.checkedAt))).toBe(true);
  });

  it('unplayable: http URL is rejected without any network call (mixed content)', async () => {
    const { fn } = mockFetch({});
    const r = await checkStream(ch('http://s.example/x.m3u8'), fast);
    expect(r.status).toBe('unplayable');
    expect(r.reason).toMatch(/http stream/);
    expect(fn).toHaveBeenCalledTimes(0);
  });

  it('unplayable: stream that needs a custom referrer/user-agent', async () => {
    const { fn } = mockFetch(healthyStream(B));
    const r = await checkStream(ch(undefined, true), fast);
    expect(r.status).toBe('unplayable');
    expect(fn).toHaveBeenCalledTimes(0);
  });

  it('offline: playlist answers 404', async () => {
    mockFetch({});
    const r = await checkStream(ch(), fast);
    expect(r.status).toBe('offline');
    expect(r.reason).toBe('HTTP 404');
  });

  it('unplayable: no CORS header, and it is not retried', async () => {
    const routes = healthyStream(B);
    routes[`${B}/master.m3u8`].cors = false;
    const { fn } = mockFetch(routes);
    const r = await checkStream(ch(), { timeoutMs: 200, retries: 2 });
    expect(r.status).toBe('unplayable');
    expect(r.reason).toBe('no CORS on playlist');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('unplayable: response is not an HLS playlist', async () => {
    mockFetch({ [`${B}/master.m3u8`]: { body: '<html>Not here</html>' } });
    const r = await checkStream(ch(), fast);
    expect(r.status).toBe('unplayable');
    expect(r.reason).toBe('not an HLS playlist');
  });

  it('offline: first video segment is missing', async () => {
    const routes = healthyStream(B);
    delete routes[`${B}/low/seg1.ts`];
    mockFetch(routes);
    const r = await checkStream(ch(), fast);
    expect(r.status).toBe('offline');
    expect(r.reason).toBe('segment HTTP 404');
  });

  it('offline: server never answers -> timeout', async () => {
    mockFetch({ [`${B}/master.m3u8`]: { hang: true } });
    const r = await checkStream(ch(), { timeoutMs: 50, retries: 0 });
    expect(r.status).toBe('offline');
    expect(r.reason).toBe('timeout');
  });

  it('retries a network error once and then passes', async () => {
    const { fn } = mockFetch(healthyStream(B));
    const real = fn.getMockImplementation()!;
    let first = true;
    fn.mockImplementation(async (input: unknown, init?: RequestInit) => {
      if (first) {
        first = false;
        throw new TypeError('fetch failed');
      }
      return real(input, init);
    });
    const r = await checkStream(ch(), { timeoutMs: 200, retries: 1 });
    expect(r.status).toBe('online');
  });

  it('shallow mode only checks the playlist', async () => {
    const { calls } = mockFetch(healthyStream(B));
    const r = await checkStream(ch(), { ...fast, deep: false });
    expect(r.status).toBe('online');
    expect(calls).toHaveLength(1);
  });
});

describe('checkMany', () => {
  it('returns one result per channel id', async () => {
    mockFetch(healthyStream(B));
    const res = await checkMany(
      [
        { id: 'a', ...ch() },
        { id: 'b', ...ch('https://dead.example/x.m3u8') },
      ],
      fast,
      2,
    );
    expect(res.get('a')?.status).toBe('online');
    expect(res.get('b')?.status).toBe('offline');
  });
});
