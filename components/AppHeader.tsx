import { Tv } from 'lucide-react';
import type { CastStatus } from '@/hooks/useCast';
import type { CastSupport } from '@/lib/cast';
import type { Theme } from '@/lib/theme';
import CastPill from './CastPill';
import ThemeToggle from './ThemeToggle';

type Props = {
  theme: Theme;
  onToggleTheme: () => void;
  cast: { support: CastSupport; status: CastStatus; device: string | null };
  onCastPill: () => void;
  onHome: () => void;
};

export default function AppHeader({ theme, onToggleTheme, cast, onCastPill, onHome }: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-tv-line bg-tv-surface/90 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center gap-2 px-3 py-3 sm:px-4">
        <button type="button" onClick={onHome} className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden" aria-label="SmartTV+ home">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-tv-accent to-tv-purple text-white shadow-sm">
            <Tv className="h-5 w-5" />
          </span>
          <span className="shrink-0 text-[17px] font-extrabold tracking-tight text-tv-fg">SmartTV+</span>
          <span className="shrink-0 rounded-md border border-tv-accent/40 max-[419px]:hidden bg-tv-accent/10 px-1.5 py-0.5 text-[10px] font-extrabold tracking-wider text-tv-accent">
            CAST
          </span>
        </button>
        <CastPill support={cast.support} status={cast.status} device={cast.device} onClick={onCastPill} />
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
    </header>
  );
}
