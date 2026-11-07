/**
 * Builds the verified catalog (Node only — used by scripts/check-streams.ts, never bundled into the app).
 * Source playlist -> parse -> scope -> health check -> keep ONLY online streams.
 */
import { promises as fs } from 'fs';
import path from 'path';
import type { Channel, CountryCoverage, VerifiedCatalog, VerifiedChannel } from '../types/channel';
import { parseM3U } from './m3u';
import { checkMany, type CheckOptions } from './streamChecker';

const env = (k: string) => process.env[k]?.trim() || undefined;

export const DEFAULT_PLAYLIST_URL = 'https://iptv-org.github.io/iptv/index.m3u';
export const DEFAULT_CATALOG_PATH = path.join('public', 'data', 'channels.verified.json');
export const playlistUrl = () => env('IPTV_PLAYLIST_URL') ?? DEFAULT_PLAYLIST_URL;

export function checkOptionsFromEnv(): Partial<CheckOptions> {
  const o: Partial<CheckOptions> = {
    deep: env('STREAM_CHECK_DEEP') !== 'false',
    requireHttps: env('REQUIRE_HTTPS') !== 'false',
    requireCors: env('REQUIRE_CORS') !== 'false',
    retries: 1,
  };
  if (env('STREAM_CHECK_TIMEOUT_MS')) o.timeoutMs = Number(env('STREAM_CHECK_TIMEOUT_MS'));
  if (env('APP_ORIGIN')) o.origin = env('APP_ORIGIN');
  return o;
}

export type ScopeOptions = {
  countries?: string[];
  categories?: string[];
  /** max streams checked per country, so every country gets represented */
  perCountry?: number;
  limit?: number;
};

/** Pure: which parsed channels get checked. UK is treated as GB. Order is preserved. */
export function selectForCheck(channels: Channel[], opts: ScopeOptions = {}): Channel[] {
  let out = channels;
  const countries = opts.countries?.map((c) => (c.toUpperCase() === 'UK' ? 'GB' : c.toUpperCase()));
  const categories = opts.categories?.map((c) => c.toLowerCase());
  if (countries?.length) out = out.filter((c) => countries.includes(c.country));
  if (categories?.length) out = out.filter((c) => c.categories.some((k) => categories.includes(k.toLowerCase())));
  if (opts.perCountry && opts.perCountry > 0) {
    const seen = new Map<string, number>();
    out = out.filter((c) => {
      const n = seen.get(c.country) ?? 0;
      if (n >= opts.perCountry!) return false;
      seen.set(c.country, n + 1);
      return true;
    });
  }
  if (opts.limit && opts.limit > 0) out = out.slice(0, opts.limit);
  return out;
}

export type BuildOptions = ScopeOptions & {
  playlist?: string;
  concurrency?: number;
  check?: Partial<CheckOptions>;
  onProgress?: (done: number, total: number, online: number) => void;
};

export type BuildResult = { catalog: VerifiedCatalog; reasons: Record<string, number> };

export async function fetchPlaylist(url = playlistUrl()): Promise<Channel[]> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 60_000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, cache: 'no-store' });
    if (!res.ok) throw new Error(`Playlist HTTP ${res.status}`);
    return parseM3U(await res.text());
  } finally {
    clearTimeout(timer);
  }
}

export async function buildVerifiedCatalog(opts: BuildOptions = {}): Promise<BuildResult> {
  const source = opts.playlist ?? playlistUrl();
  const channels = selectForCheck(await fetchPlaylist(source), opts);

  const results = await checkMany(
    channels,
    { ...checkOptionsFromEnv(), ...opts.check },
    opts.concurrency ?? Number(env('STREAM_CHECK_CONCURRENCY') ?? 24),
    opts.onProgress,
  );

  const reasons: Record<string, number> = {};
  const coverage: CountryCoverage = {};
  for (const cc of opts.countries ?? []) coverage[cc.toUpperCase() === 'UK' ? 'GB' : cc.toUpperCase()] = { checked: 0, online: 0 };
  const verified: VerifiedChannel[] = [];
  for (const ch of channels) {
    const r = results.get(ch.id);
    if (!r) continue;
    const row = (coverage[ch.country] ??= { checked: 0, online: 0 });
    row.checked++;
    if (r.status === 'online') {
      row.online++;
      verified.push({ ...ch, latencyMs: r.latencyMs, checkedAt: r.checkedAt });
    } else {
      const key = `${r.status}: ${(r.reason ?? 'unknown').replace(/\d{3}/, 'xxx')}`;
      reasons[key] = (reasons[key] ?? 0) + 1;
    }
  }
  verified.sort((a, b) => a.name.localeCompare(b.name));

  return {
    catalog: {
      generatedAt: new Date().toISOString(),
      source,
      total: channels.length,
      online: verified.length,
      coverage,
      channels: verified,
    },
    reasons,
  };
}

export async function readCatalog(file = DEFAULT_CATALOG_PATH): Promise<VerifiedCatalog | null> {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8')) as VerifiedCatalog;
  } catch {
    return null;
  }
}

export async function writeCatalog(catalog: VerifiedCatalog, file = DEFAULT_CATALOG_PATH) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, `${JSON.stringify(catalog, null, 1)}\n`);
  await fs.rename(tmp, file); // atomic swap
}
