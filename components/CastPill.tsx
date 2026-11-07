import { Cast, Smartphone } from 'lucide-react';
import type { CastStatus } from '@/hooks/useCast';
import type { CastSupport } from '@/lib/cast';
import { cn } from '@/lib/utils';

type Props = { support: CastSupport; status: CastStatus; device: string | null; onClick: () => void };

/** Header pill: which TV we cast to (green dot = connected). */
export default function CastPill({ support, status, device, onClick }: Props) {
  const phoneOnly = support === 'ios' || support === 'unsupported-browser';
  const label = phoneOnly
    ? 'This phone'
    : status === 'connected'
      ? device ?? 'Chromecast'
      : status === 'connecting'
        ? 'Connecting…'
        : status === 'no-devices'
          ? 'No TV found'
          : status === 'idle'
            ? 'Cast to TV'
            : 'Searching…';
  const connected = status === 'connected';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={connected ? `Casting to ${label}. Manage devices` : `${label}. Manage devices`}
      className={cn(
        'flex min-w-0 shrink items-center gap-2 rounded-2xl border px-2.5 py-2 text-sm font-semibold transition active:scale-95',
        connected ? 'border-tv-accent/40 bg-tv-soft text-tv-fg' : 'border-tv-line bg-tv-card text-tv-fg',
        status === 'connecting' && 'animate-pulse',
      )}
    >
      <span className="relative shrink-0 text-tv-accent">
        {phoneOnly ? <Smartphone className="h-4 w-4" /> : <Cast className="h-4 w-4" />}
        {connected && <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-tv-soft" />}
      </span>
      <span className="max-w-[7.5rem] truncate sm:max-w-[10rem]">{label}</span>
    </button>
  );
}
