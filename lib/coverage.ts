import type { CountryCoverage } from '../types/channel';
import { countryName } from './countries';

export type CoverageRow = { code: string; name: string; online: number; checked?: number; zero: boolean };

/**
 * Per-country live counts for the featured list. `zero: true` flags a country with no live channel.
 * Live counts come from the channels actually shown (after local hiding), checked counts from the last run.
 */
export function featuredCoverage(
  featured: readonly string[],
  channels: ReadonlyArray<{ country: string }>,
  lastRun?: CountryCoverage,
): CoverageRow[] {
  const counts = new Map<string, number>();
  channels.forEach((c) => counts.set(c.country, (counts.get(c.country) ?? 0) + 1));
  return featured.map((code) => {
    const online = counts.get(code) ?? 0;
    return { code, name: countryName(code), online, checked: lastRun?.[code]?.checked, zero: online === 0 };
  });
}

export const zeroCountries = (rows: CoverageRow[]) => rows.filter((r) => r.zero).map((r) => r.code);
