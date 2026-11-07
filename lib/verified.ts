/**
 * Rule 1 gate (runs in the browser): the app renders ONLY what passes here.
 * The JSON file is untrusted input — a hand-edited or corrupted file must not leak unverified channels.
 * A channel is accepted only if it carries the evidence of a passed check:
 *   https URL · no custom headers · valid checkedAt · id + name present.
 * There is deliberately no fallback list: if the catalog cannot be loaded or validated, nothing is shown.
 */
import type { VerifiedCatalog, VerifiedChannel } from '../types/channel';
import { countryName } from './countries';

export type GateResult = {
  catalog: VerifiedCatalog | null;
  channels: VerifiedChannel[];
  rejected: number;
  error?: string;
};

const isStr = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const isDate = (v: unknown) => isStr(v) && Number.isFinite(Date.parse(v));

export function isVerifiedChannel(x: unknown): x is VerifiedChannel {
  if (!x || typeof x !== 'object') return false;
  const c = x as Record<string, unknown>;
  return (
    isStr(c.id) &&
    isStr(c.name) &&
    isStr(c.url) &&
    (c.url as string).toLowerCase().startsWith('https://') &&
    c.requiresHeaders !== true &&
    isDate(c.checkedAt) &&
    isStr(c.country)
  );
}

export function gateCatalog(raw: unknown): GateResult {
  if (!raw || typeof raw !== 'object') return { catalog: null, channels: [], rejected: 0, error: 'catalog is not an object' };
  const r = raw as Record<string, unknown>;
  if (!isDate(r.generatedAt) || !Array.isArray(r.channels)) {
    return { catalog: null, channels: [], rejected: 0, error: 'catalog has no generatedAt or channels list' };
  }

  const seen = new Set<string>();
  const channels: VerifiedChannel[] = [];
  let rejected = 0;
  for (const item of r.channels as unknown[]) {
    if (!isVerifiedChannel(item) || seen.has(item.id)) {
      rejected++;
      continue;
    }
    seen.add(item.id);
    const country = item.country.toUpperCase() === 'UK' ? 'GB' : item.country.toUpperCase();
    channels.push({
      ...item,
      country,
      countryName: isStr(item.countryName) ? item.countryName : countryName(country),
      categories: Array.isArray(item.categories) && item.categories.length ? item.categories.filter(isStr) : ['General'],
      flags: Array.isArray(item.flags) ? item.flags.filter(isStr) : [],
      requiresHeaders: false,
    });
  }

  const catalog: VerifiedCatalog = {
    generatedAt: r.generatedAt as string,
    source: isStr(r.source) ? r.source : 'unknown',
    total: typeof r.total === 'number' ? r.total : channels.length,
    online: channels.length,
    coverage: r.coverage && typeof r.coverage === 'object' ? (r.coverage as VerifiedCatalog['coverage']) : undefined,
    channels,
  };
  return { catalog, channels, rejected };
}

/** Verified channels minus the ones that failed to play on this device. */
export function visibleChannels(channels: VerifiedChannel[], hidden: ReadonlySet<string>): VerifiedChannel[] {
  return hidden.size ? channels.filter((c) => !hidden.has(c.id)) : channels;
}
