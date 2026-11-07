import { describe, expect, it } from 'vitest';
import { gateCatalog, isVerifiedChannel, visibleChannels } from '../lib/verified';
import { verifiedChannel } from './helpers';

const catalog = (channels: unknown[]) => ({ generatedAt: '2026-11-07T06:00:00.000Z', source: 'test', total: 10, online: channels.length, channels });

describe('Rule 1 gate', () => {
  it('accepts a channel that carries evidence of a passed check', () => {
    expect(isVerifiedChannel(verifiedChannel())).toBe(true);
  });

  const BAD: Array<[string, Record<string, unknown>]> = [
    ['http URL', { url: 'http://x.example/a.m3u8' }],
    ['needs custom headers', { requiresHeaders: true }],
    ['missing checkedAt', { checkedAt: undefined }],
    ['invalid checkedAt', { checkedAt: 'yesterday-ish' }],
    ['missing name', { name: '' }],
    ['missing id', { id: '' }],
  ];
  it.each(BAD)('rejects: %s', (_label, patch) => {
    expect(isVerifiedChannel({ ...verifiedChannel(), ...patch })).toBe(false);
  });

  it('keeps only valid, unique channels and counts the rejected ones', () => {
    const r = gateCatalog(
      catalog([
        verifiedChannel({ id: 'a' }),
        verifiedChannel({ id: 'a', name: 'duplicate' }),
        verifiedChannel({ id: 'b', url: 'http://plain.example/x.m3u8' }),
        'garbage',
        null,
        verifiedChannel({ id: 'c', country: 'uk' }),
      ]),
    );
    expect(r.channels.map((c) => c.id)).toEqual(['a', 'c']);
    expect(r.rejected).toBe(4);
    expect(r.channels[1].country).toBe('GB');
    expect(r.catalog?.online).toBe(2);
  });

  it('returns nothing (no fallback) for a malformed catalog', () => {
    for (const bad of [null, 'x', 42, {}, { channels: [] }, { generatedAt: 'nope', channels: [] }, { generatedAt: '2026-11-07T00:00:00Z' }]) {
      const r = gateCatalog(bad);
      expect(r.catalog).toBeNull();
      expect(r.channels).toEqual([]);
    }
  });

  it('visibleChannels removes channels that failed on this device', () => {
    const list = [verifiedChannel({ id: 'a' }), verifiedChannel({ id: 'b' })];
    expect(visibleChannels(list, new Set(['b'])).map((c) => c.id)).toEqual(['a']);
    expect(visibleChannels(list, new Set())).toHaveLength(2);
  });
});
