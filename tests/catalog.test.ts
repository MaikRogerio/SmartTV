import { describe, expect, it } from 'vitest';
import { buildVerifiedCatalog, selectForCheck } from '../lib/catalog';
import type { Channel } from '../types/channel';
import { healthyStream, mockFetch } from './helpers';

const mk = (id: string, country: string, categories = ['News']): Channel => ({
  id,
  name: id,
  url: `https://s.example/${id}/master.m3u8`,
  country,
  countryName: country,
  categories,
  flags: [],
  requiresHeaders: false,
});

describe('selectForCheck', () => {
  const all = [mk('us1', 'US'), mk('us2', 'US'), mk('us3', 'US'), mk('gb1', 'GB'), mk('fr1', 'FR'), mk('mx1', 'MX', ['Sports'])];

  it('filters by country and treats UK as GB', () => {
    expect(selectForCheck(all, { countries: ['uk', 'MX'] }).map((c) => c.id)).toEqual(['gb1', 'mx1']);
  });

  it('caps streams per country so every country is represented', () => {
    expect(selectForCheck(all, { perCountry: 2 }).map((c) => c.id)).toEqual(['us1', 'us2', 'gb1', 'fr1', 'mx1']);
  });

  it('filters by category (case-insensitive) and applies an overall limit', () => {
    expect(selectForCheck(all, { categories: ['sports'] }).map((c) => c.id)).toEqual(['mx1']);
    expect(selectForCheck(all, { limit: 2 })).toHaveLength(2);
  });
});

describe('buildVerifiedCatalog', () => {
  it('publishes ONLY streams that passed, with per-country coverage', async () => {
    const playlist = [
      '#EXTM3U',
      '#EXTINF:-1 tvg-id="Good.us",Good US',
      'https://s.example/good/master.m3u8',
      '#EXTINF:-1 tvg-id="Dead.us",Dead US',
      'https://s.example/dead/master.m3u8',
      '#EXTINF:-1 tvg-id="Plain.ru",Plain HTTP RU',
      'http://s.example/plain/master.m3u8',
      '#EXTINF:-1 tvg-id="Other.fr",Out of scope FR',
      'https://s.example/fr/master.m3u8',
    ].join('\n');
    mockFetch({ 'https://list.example/x.m3u': { body: playlist }, ...healthyStream('https://s.example/good'), ...healthyStream('https://s.example/fr') });

    const { catalog, reasons } = await buildVerifiedCatalog({
      playlist: 'https://list.example/x.m3u',
      countries: ['US', 'RU', 'AR'],
      check: { timeoutMs: 200, retries: 0 },
      concurrency: 2,
    });

    expect(catalog.channels.map((c) => c.name)).toEqual(['Good US']);
    expect(catalog.total).toBe(3);
    expect(catalog.online).toBe(1);
    expect(catalog.coverage).toEqual({ US: { checked: 2, online: 1 }, RU: { checked: 1, online: 0 }, AR: { checked: 0, online: 0 } });
    expect(Object.values(reasons).reduce((a, b) => a + b, 0)).toBe(2);
    expect(catalog.channels.every((c) => Number.isFinite(Date.parse(c.checkedAt)))).toBe(true);
  });
});
