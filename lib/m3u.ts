import type { Channel } from '../types/channel';
import { countryName } from './countries';

const ATTR_RE = /([a-zA-Z0-9-]+)="([^"]*)"/g;
const TAG_RE = /\[([^\]]+)\]/g;

/** Short, stable id from a string (djb2) */
export function hashId(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/** "AlJazeera.qa@SD" -> "QA"; "BBCOne.uk" -> "GB" */
export function countryFromTvgId(tvgId?: string): string {
  if (!tvgId) return 'INT';
  const base = tvgId.split('@')[0];
  const dot = base.lastIndexOf('.');
  if (dot < 0) return 'INT';
  const cc = base.slice(dot + 1).toUpperCase();
  if (cc === 'UK') return 'GB';
  return /^[A-Z]{2}$/.test(cc) ? cc : 'INT';
}

function normaliseCategories(groupTitle?: string): string[] {
  const cats = (groupTitle ?? '')
    .split(';')
    .map((c) => c.trim())
    .filter((c) => c && c.toLowerCase() !== 'undefined');
  return cats.length ? cats : ['General'];
}

/** Parse an extended M3U playlist (iptv-org format). Duplicate URLs are dropped. */
export function parseM3U(text: string): Channel[] {
  const out: Channel[] = [];
  const seen = new Set<string>();
  let attrs: Record<string, string> | null = null;
  let rawName = '';
  let requiresHeaders = false;

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF')) {
      attrs = {};
      for (const m of line.matchAll(ATTR_RE)) attrs[m[1].toLowerCase()] = m[2];
      const comma = line.indexOf(',', line.lastIndexOf('"') + 1);
      rawName = comma >= 0 ? line.slice(comma + 1).trim() : 'Unknown';
      requiresHeaders = false;
      continue;
    }
    if (line.startsWith('#EXTVLCOPT') || line.startsWith('#KODIPROP')) {
      if (/http-(referrer|referer|user-agent)/i.test(line)) requiresHeaders = true;
      continue;
    }
    if (line.startsWith('#')) continue;

    if (!attrs) continue;
    const url = line;
    if (!/^https?:\/\//i.test(url) || seen.has(url)) {
      attrs = null;
      continue;
    }
    seen.add(url);

    const flags = [...rawName.matchAll(TAG_RE)].map((m) => m[1]);
    const name =
      rawName.replace(TAG_RE, '').replace(/\(\d{3,4}[pi]\)/gi, '').replace(/\s{2,}/g, ' ').trim() || 'Unknown';
    const tvgId = attrs['tvg-id'] || undefined;
    const country = countryFromTvgId(tvgId);

    out.push({
      id: hashId(url),
      tvgId,
      name,
      logo: attrs['tvg-logo'] || undefined,
      url,
      country,
      countryName: countryName(country),
      categories: normaliseCategories(attrs['group-title']),
      flags,
      requiresHeaders,
    });
    attrs = null;
  }
  return out;
}
