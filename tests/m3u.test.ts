import { describe, expect, it } from 'vitest';
import { countryFromTvgId, hashId, parseM3U } from '../lib/m3u';

const PLAYLIST = `#EXTM3U
#EXTINF:-1 tvg-id="AlJazeera.qa@SD" tvg-logo="https://logo.example/a,b.png" group-title="News",Al Jazeera, English (1080p) [Geo-blocked]
https://aj.example/master.m3u8
#EXTINF:-1 tvg-id="BBCOne.uk" group-title="Undefined",BBC One [Not 24/7]
#EXTVLCOPT:http-referrer=https://bbc.example
https://bbc.example/live.m3u8
#EXTINF:-1 tvg-id="Telefe.ar" group-title="Entertainment;Movies",Telefe
http://telefe.example/live.m3u8
#EXTINF:-1 group-title="News",Duplicate of Al Jazeera
https://aj.example/master.m3u8
#EXTINF:-1 tvg-id="Rtp1.pt",RTP 1
rtmp://not-http.example/live
#EXTINF:-1 tvg-id="Rossiya1.ru" group-title="General",Rossiya 1 (720p)
https://ru.example/index.m3u8
`;

describe('parseM3U', () => {
  const channels = parseM3U(PLAYLIST);

  it('keeps one entry per http(s) URL and drops duplicates and non-http URLs', () => {
    expect(channels.map((c) => c.url)).toEqual([
      'https://aj.example/master.m3u8',
      'https://bbc.example/live.m3u8',
      'http://telefe.example/live.m3u8',
      'https://ru.example/index.m3u8',
    ]);
  });

  it('reads attributes, a name containing commas, tags and resolution', () => {
    const aj = channels[0];
    expect(aj.name).toBe('Al Jazeera, English');
    expect(aj.logo).toBe('https://logo.example/a,b.png');
    expect(aj.flags).toEqual(['Geo-blocked']);
    expect(aj.country).toBe('QA');
    expect(aj.categories).toEqual(['News']);
    expect(aj.id).toBe(hashId('https://aj.example/master.m3u8'));
  });

  it('maps .uk to GB, "Undefined" group to General and flags streams needing custom headers', () => {
    const bbc = channels[1];
    expect(bbc.country).toBe('GB');
    expect(bbc.countryName).toBe('United Kingdom');
    expect(bbc.categories).toEqual(['General']);
    expect(bbc.flags).toEqual(['Not 24/7']);
    expect(bbc.requiresHeaders).toBe(true);
  });

  it('splits multiple categories and strips the resolution tag', () => {
    expect(channels[2].categories).toEqual(['Entertainment', 'Movies']);
    expect(channels[3].name).toBe('Rossiya 1');
    expect(channels[3].country).toBe('RU');
    expect(channels[3].requiresHeaders).toBe(false);
  });

  it('country helper handles missing / odd ids', () => {
    expect(countryFromTvgId(undefined)).toBe('INT');
    expect(countryFromTvgId('NoDot')).toBe('INT');
    expect(countryFromTvgId('Foo.mx@HD')).toBe('MX');
    expect(countryFromTvgId('Foo.int')).toBe('INT');
  });

  it('ignores an #EXTINF without a URL and survives empty input', () => {
    expect(parseM3U('#EXTM3U\n#EXTINF:-1,Lonely\n')).toEqual([]);
    expect(parseM3U('')).toEqual([]);
  });
});
