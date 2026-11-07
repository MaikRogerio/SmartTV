import { describe, expect, it } from 'vitest';
import { FEATURED_COUNTRIES, REQUIRED_COUNTRIES } from '../lib/featured-countries';
import { featuredCoverage, zeroCountries } from '../lib/coverage';

describe('Rule 2: featured countries', () => {
  it('has exactly 13 unique ISO codes', () => {
    expect(FEATURED_COUNTRIES).toHaveLength(13);
    expect(new Set(FEATURED_COUNTRIES).size).toBe(13);
    for (const cc of FEATURED_COUNTRIES) expect(cc).toMatch(/^[A-Z]{2}$/);
  });

  it('always includes US, GB, MX, RU and AR', () => {
    expect([...REQUIRED_COUNTRIES]).toEqual(['US', 'GB', 'MX', 'RU', 'AR']);
    for (const cc of REQUIRED_COUNTRIES) expect(FEATURED_COUNTRIES).toContain(cc);
  });
});

describe('coverage flags', () => {
  it('flags a featured country with 0 live channels', () => {
    const rows = featuredCoverage(['US', 'RU', 'AR'], [{ country: 'US' }, { country: 'US' }, { country: 'AR' }], { RU: { checked: 60, online: 0 } });
    expect(rows.map((r) => [r.code, r.online, r.zero])).toEqual([
      ['US', 2, false],
      ['RU', 0, true],
      ['AR', 1, false],
    ]);
    expect(rows[1].checked).toBe(60);
    expect(zeroCountries(rows)).toEqual(['RU']);
  });
});
