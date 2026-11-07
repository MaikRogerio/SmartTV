let displayNames: Intl.DisplayNames | null = null;

export function countryName(code: string): string {
  if (!code || code === 'INT') return 'International';
  try {
    displayNames ??= new Intl.DisplayNames(['en'], { type: 'region' });
    return displayNames.of(code) ?? code;
  } catch {
    return code;
  }
}

export function flagEmoji(code: string): string {
  if (code === 'UK') code = 'GB';
  if (!/^[A-Z]{2}$/.test(code)) return '🌐';
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}
