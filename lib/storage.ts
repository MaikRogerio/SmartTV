/** localStorage helpers (favorites, recent, channels that failed on this device). Never throw. */
const KEYS = {
  favorites: 'smarttv.favorites',
  recent: 'smarttv.recent',
  failed: 'smarttv.failed',
} as const;

/** A channel that failed to start on this phone stays hidden this long (covers geo-blocking). */
export const FAILED_HIDE_MS = 3 * 24 * 3_600_000;
const RECENT_MAX = 20;

function read<T>(key: string, fallback: T): T {
  try {
    const v = globalThis.localStorage?.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    globalThis.localStorage?.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full / private mode */
  }
}

const idList = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

export const loadFavorites = () => idList(read(KEYS.favorites, []));
export const saveFavorites = (ids: string[]) => write(KEYS.favorites, ids);

export const loadRecent = () => idList(read(KEYS.recent, [])).slice(0, RECENT_MAX);
export function pushRecent(ids: string[], id: string): string[] {
  const next = [id, ...ids.filter((x) => x !== id)].slice(0, RECENT_MAX);
  write(KEYS.recent, next);
  return next;
}

/** Ids of channels that failed on this device and are still inside the hide window. Expired entries are pruned. */
export function loadFailed(now = Date.now()): Set<string> {
  const raw = read<Record<string, number>>(KEYS.failed, {});
  const kept: Record<string, number> = {};
  for (const [id, at] of Object.entries(raw ?? {})) {
    if (typeof at === 'number' && now - at < FAILED_HIDE_MS) kept[id] = at;
  }
  write(KEYS.failed, kept);
  return new Set(Object.keys(kept));
}
export function markFailed(id: string, now = Date.now()) {
  const raw = read<Record<string, number>>(KEYS.failed, {});
  write(KEYS.failed, { ...raw, [id]: now });
}
export function clearFailed() {
  write(KEYS.failed, {});
}
