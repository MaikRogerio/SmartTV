import { useCallback, useEffect, useState } from 'react';
import type { VerifiedCatalog, VerifiedChannel } from '@/types/channel';
import { gateCatalog } from '@/lib/verified';

export const CATALOG_URL = `${import.meta.env.BASE_URL}data/channels.verified.json`;

type State = {
  catalog: VerifiedCatalog | null;
  channels: VerifiedChannel[];
  rejected: number;
  loading: boolean;
  error: string | null;
};

/** Loads the static catalog and passes it through the Rule 1 gate. No fallback channels on failure. */
export function useCatalog(url = CATALOG_URL) {
  const [state, setState] = useState<State>({ catalog: null, channels: [], rejected: 0, loading: true, error: null });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const gated = gateCatalog(await res.json());
      if (!gated.catalog) throw new Error(gated.error ?? 'invalid catalog');
      if (gated.rejected) console.warn(`[catalog] ${gated.rejected} entries rejected by the verification gate`);
      setState({ catalog: gated.catalog, channels: gated.channels, rejected: gated.rejected, loading: false, error: null });
    } catch (e) {
      setState({ catalog: null, channels: [], rejected: 0, loading: false, error: (e as Error).message });
    }
  }, [url]);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, reload: load };
}
