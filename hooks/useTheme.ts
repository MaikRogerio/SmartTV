import { useCallback, useEffect, useState } from 'react';
import { applyTheme, readThemePref, resolveTheme, saveThemePref, systemPrefersDark, type ThemePref } from '@/lib/theme';

/** Light / dark / follow-the-phone. Saved in localStorage; follows OS changes while on "system". */
export function useTheme() {
  const [pref, setPrefState] = useState<ThemePref>(readThemePref);
  const [prefersDark, setPrefersDark] = useState<boolean>(systemPrefersDark);
  const theme = resolveTheme(pref, prefersDark);

  useEffect(() => applyTheme(theme), [theme]);

  useEffect(() => {
    if (typeof globalThis.matchMedia !== 'function') return;
    const mq = globalThis.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setPrefersDark(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  const setPref = useCallback((p: ThemePref) => {
    saveThemePref(p);
    setPrefState(p);
  }, []);

  const toggle = useCallback(() => setPref(theme === 'dark' ? 'light' : 'dark'), [setPref, theme]);

  return { pref, theme, setPref, toggle };
}
