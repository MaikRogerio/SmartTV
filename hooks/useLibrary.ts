import { useCallback, useState } from 'react';
import { clearFailed, loadFailed, loadFavorites, loadRecent, markFailed, pushRecent, saveFavorites } from '@/lib/storage';

/** Favorites, recently watched and locally failed channels — all in localStorage (no server). */
export function useLibrary() {
  const [favorites, setFavorites] = useState<string[]>(loadFavorites);
  const [recent, setRecent] = useState<string[]>(loadRecent);
  const [failed, setFailed] = useState<Set<string>>(() => loadFailed());

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((f) => f !== id) : [id, ...prev];
      saveFavorites(next);
      return next;
    });
  }, []);

  const addRecent = useCallback((id: string) => setRecent((prev) => pushRecent(prev, id)), []);

  const hideFailed = useCallback((id: string) => {
    markFailed(id);
    setFailed((prev) => new Set(prev).add(id));
  }, []);

  const resetFailed = useCallback(() => {
    clearFailed();
    setFailed(new Set());
  }, []);

  return { favorites, recent, failed, isFavorite, toggleFavorite, addRecent, hideFailed, resetFailed };
}
