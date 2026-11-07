import { AlertTriangle, Cast, Monitor, Moon, ShieldCheck, Smartphone, Sun } from 'lucide-react';
import type { VerifiedCatalog } from '@/types/channel';
import type { CastStatus } from '@/hooks/useCast';
import { CAST_HELP, type CastSupport } from '@/lib/cast';
import type { CoverageRow } from '@/lib/coverage';
import type { ThemePref } from '@/lib/theme';
import { cn, timeAgo } from '@/lib/utils';
import SectionHeader from '../SectionHeader';

export const STALE_AFTER_MS = 24 * 3_600_000;

type Props = {
  cast: { support: CastSupport; status: CastStatus; device: string | null };
  onConnect: () => void;
  onDisconnect: () => void;
  catalog: VerifiedCatalog | null;
  shown: number;
  hiddenOnDevice: number;
  onResetHidden: () => void;
  featured: CoverageRow[];
  themePref: ThemePref;
  onThemePref: (p: ThemePref) => void;
};

const card = 'mx-4 rounded-2xl border border-tv-line bg-tv-surface p-4';

export default function DevicesTab(p: Props) {
  const phoneOnly = p.cast.support === 'ios' || p.cast.support === 'unsupported-browser';
  const connected = p.cast.status === 'connected';
  const stale = p.catalog ? Date.now() - Date.parse(p.catalog.generatedAt) > STALE_AFTER_MS : false;

  return (
    <div className="space-y-6 pt-4">
      <section>
        <SectionHeader icon={<Cast className="h-4 w-4" />} title="Cast device" />
        <div className={card}>
          <div className="flex items-center gap-3">
            <span className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-tv-soft text-tv-accent">
              {phoneOnly ? <Smartphone className="h-6 w-6" /> : <Monitor className="h-6 w-6" />}
              {connected && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-tv-surface" />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-bold text-tv-fg">{phoneOnly ? 'This phone only' : connected ? p.cast.device ?? 'Chromecast' : 'No TV connected'}</div>
              <div className="truncate text-sm text-tv-muted">
                {phoneOnly ? 'Casting not available in this browser' : connected ? 'Connected' : p.cast.status === 'no-devices' ? 'No Chromecast on this Wi-Fi' : 'Chrome lists the TVs on your Wi-Fi'}
              </div>
            </div>
            {!phoneOnly &&
              (connected ? (
                <button type="button" onClick={p.onDisconnect} className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300">Disconnect</button>
              ) : (
                <button type="button" onClick={p.onConnect} className="rounded-xl bg-tv-accent px-4 py-2.5 text-sm font-bold text-tv-accent-fg">Connect</button>
              ))}
          </div>
          {phoneOnly && <p className="mt-3 rounded-xl bg-tv-card p-3 text-sm text-tv-muted">{CAST_HELP[p.cast.support as 'ios' | 'unsupported-browser']}</p>}
          {!phoneOnly && !connected && (
            <ul className="mt-3 space-y-1 text-sm text-tv-muted">
              <li>• Phone and Chromecast on the same Wi-Fi</li>
              <li>• Use Google Chrome on Android</li>
              <li>• Tap Connect and pick your TV</li>
            </ul>
          )}
        </div>
      </section>

      <section>
        <SectionHeader icon={<ShieldCheck className="h-4 w-4" />} title="Channel check" meta={p.catalog ? `checked ${timeAgo(p.catalog.generatedAt)}` : undefined} />
        <div className={card}>
          {p.catalog ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-tv-muted">Live channels shown</span><span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{p.shown}</span></div>
              <div className="flex justify-between"><span className="text-tv-muted">Streams checked in last run</span><span className="font-mono text-tv-fg">{p.catalog.total}</span></div>
              <div className="flex justify-between"><span className="text-tv-muted">Last check</span><span className={cn('font-mono', stale ? 'text-amber-600 dark:text-amber-300' : 'text-tv-fg')}>{new Date(p.catalog.generatedAt).toLocaleString()}</span></div>
              {p.hiddenOnDevice > 0 && (
                <div className="flex items-center justify-between gap-3 border-t border-tv-line pt-2">
                  <span className="text-tv-muted">{p.hiddenOnDevice} hidden after failing on this phone</span>
                  <button type="button" onClick={p.onResetHidden} className="shrink-0 font-semibold text-tv-accent">Show again</button>
                </div>
              )}
              <p className="pt-1 text-xs text-tv-muted">Only streams that passed the automatic check are listed. The check runs every 6 hours.</p>
            </div>
          ) : (
            <p className="text-sm text-tv-muted">Channel list not loaded.</p>
          )}
        </div>
      </section>

      <section>
        <SectionHeader title="Country coverage" meta={`${p.featured.length} countries`} />
        <ul className="mx-4 divide-y divide-tv-line overflow-hidden rounded-2xl border border-tv-line bg-tv-surface">
          {p.featured.map((r) => (
            <li key={r.code} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              <span className="w-7 font-mono text-xs lowercase text-tv-muted">{r.code}</span>
              <span className="flex-1 text-tv-fg">{r.name}</span>
              {r.zero ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="h-3.5 w-3.5" /> none live
                </span>
              ) : (
                <span className="font-mono text-tv-fg">{r.online}</span>
              )}
              {typeof r.checked === 'number' && <span className="w-12 text-right font-mono text-xs text-tv-muted">/ {r.checked}</span>}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <SectionHeader title="Appearance" />
        <div className="mx-4 grid grid-cols-3 gap-2 rounded-2xl border border-tv-line bg-tv-surface p-1.5" role="radiogroup" aria-label="Theme">
          {([['light', 'Light', Sun], ['dark', 'Dark', Moon], ['system', 'Auto', Smartphone]] as const).map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={p.themePref === value}
              onClick={() => p.onThemePref(value)}
              className={cn('flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold', p.themePref === value ? 'bg-tv-ink text-tv-ink-fg' : 'text-tv-muted')}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
