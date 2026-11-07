import { Cast, Loader2, Smartphone, WifiOff } from 'lucide-react';
import type { CastStatus } from '@/hooks/useCast';
import { CAST_HELP, type CastSupport } from '@/lib/cast';

type Props = { support: CastSupport; status: CastStatus; device: string | null; onConnect: () => void; onManage: () => void };

/** "Direct Chromecast" card under the search bar. */
export default function CastStatusCard({ support, status, device, onConnect, onManage }: Props) {
  let icon = <Cast className="h-6 w-6" />;
  let title = 'Direct Chromecast';
  let sub = 'Streams go straight from the source to your TV';
  let action = { label: 'Manage', run: onManage };

  if (support === 'ios' || support === 'unsupported-browser') {
    icon = <Smartphone className="h-6 w-6" />;
    title = 'Watching on this phone';
    sub = CAST_HELP[support];
    action = { label: 'Info', run: onManage };
  } else if (status === 'connected') {
    title = `Casting to ${device ?? 'Chromecast'}`;
  } else if (status === 'connecting') {
    icon = <Loader2 className="h-6 w-6 animate-spin" />;
    title = 'Connecting…';
    sub = 'Accept on the TV if asked';
  } else if (status === 'idle') {
    title = 'Chromecast found';
    sub = 'Connect, then pick any channel';
    action = { label: 'Connect', run: onConnect };
  } else if (status === 'no-devices') {
    icon = <WifiOff className="h-6 w-6" />;
    title = 'No Chromecast found';
    sub = 'Is the phone on the same Wi-Fi as the TV?';
    action = { label: 'Help', run: onManage };
  } else {
    icon = <Loader2 className="h-6 w-6 animate-spin" />;
    title = 'Looking for Chromecast…';
  }

  return (
    <div className="mx-4 flex items-center gap-3 rounded-2xl border border-tv-accent/30 bg-tv-soft p-3.5">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-tv-accent/30 bg-tv-accent/15 text-tv-accent">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-bold text-tv-fg">{title}</div>
        <div className="truncate text-sm text-tv-muted">{sub}</div>
      </div>
      <button type="button" onClick={action.run} className="shrink-0 rounded-xl bg-tv-accent px-4 py-2.5 text-sm font-bold text-tv-accent-fg shadow-sm transition active:scale-95">
        {action.label}
      </button>
    </div>
  );
}
