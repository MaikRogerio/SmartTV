/** Light / dark / system theme. index.html applies the same logic before first paint. */
export type ThemePref = 'light' | 'dark' | 'system';
export type Theme = 'light' | 'dark';

export const THEME_KEY = 'smarttv.theme';
export const THEME_COLOR: Record<Theme, string> = { light: '#f6f8fb', dark: '#0a0a1a' };

export function readThemePref(): ThemePref {
  try {
    const v = globalThis.localStorage?.getItem(THEME_KEY);
    return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
  } catch {
    return 'system';
  }
}

export function saveThemePref(pref: ThemePref) {
  try {
    globalThis.localStorage?.setItem(THEME_KEY, pref);
  } catch {
    /* private mode */
  }
}

export const systemPrefersDark = () =>
  typeof globalThis.matchMedia === 'function' && globalThis.matchMedia('(prefers-color-scheme: dark)').matches;

export function resolveTheme(pref: ThemePref, prefersDark: boolean): Theme {
  if (pref === 'system') return prefersDark ? 'dark' : 'light';
  return pref;
}

export function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme]);
}
