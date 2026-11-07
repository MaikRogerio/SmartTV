export type Channel = {
  /** Stable id derived from the stream URL */
  id: string;
  tvgId?: string;
  name: string;
  logo?: string;
  url: string;
  /** ISO 3166-1 alpha-2, or 'INT' when unknown / international */
  country: string;
  countryName: string;
  categories: string[];
  /** Tags taken from the playlist name, e.g. "Geo-blocked", "Not 24/7" */
  flags: string[];
  /** Stream needs a custom Referer / User-Agent -> cannot be played by a browser */
  requiresHeaders: boolean;
};

export type StreamStatus = 'online' | 'offline' | 'unplayable';

export type CheckResult = {
  status: StreamStatus;
  reason?: string;
  latencyMs?: number;
  checkedAt: string;
};

/** A channel that passed the health check. Only these may ever be rendered (Rule 1). */
export type VerifiedChannel = Channel & { latencyMs?: number; checkedAt: string };

export type CountryCoverage = Record<string, { checked: number; online: number }>;

export type VerifiedCatalog = {
  generatedAt: string;
  source: string;
  /** Streams checked */
  total: number;
  /** Streams that passed */
  online: number;
  /** Per-country checked/online counts from the last run */
  coverage?: CountryCoverage;
  channels: VerifiedChannel[];
};
