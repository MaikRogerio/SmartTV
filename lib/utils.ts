import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function timeAgo(iso?: string, now = Date.now()): string {
  if (!iso) return 'never';
  const mins = Math.round((now - Date.parse(iso)) / 60000);
  if (!Number.isFinite(mins)) return 'unknown';
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return `${hrs} h ago`;
  return `${Math.round(hrs / 24)} days ago`;
}

/** "24 Horas" -> "24H", "Antena 3" -> "A3" */
export function initials(name: string): string {
  const words = name.replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean);
  if (!words.length) return 'TV';
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  if (/^\d+$/.test(words[0])) return `${words[0].slice(0, 3)}${words[1][0].toLowerCase()}`; // "24 Horas" -> "24h"
  return (words[0][0] + words[1][0]).toUpperCase();
}

const TILE_GRADIENTS = [
  'from-rose-500 to-red-700',
  'from-orange-400 to-amber-700',
  'from-sky-400 to-blue-700',
  'from-violet-500 to-purple-800',
  'from-emerald-400 to-teal-700',
  'from-pink-500 to-fuchsia-700',
  'from-cyan-400 to-sky-700',
  'from-indigo-400 to-indigo-800',
];

/** Deterministic colour for a channel tile without a logo. */
export function tileGradient(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return TILE_GRADIENTS[Math.abs(h) % TILE_GRADIENTS.length];
}
