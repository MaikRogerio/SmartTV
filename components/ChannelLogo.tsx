import { useState } from 'react';
import type { VerifiedChannel } from '@/types/channel';
import { cn, initials, tileGradient } from '@/lib/utils';

const SIZES = { sm: 'h-11 w-11 rounded-xl text-sm', md: 'h-12 w-12 rounded-xl text-sm', lg: 'h-14 w-14 rounded-2xl text-base', xl: 'h-28 w-28 rounded-3xl text-3xl' };

/** Channel logo on a white tile, or a coloured initials tile when there is no (working) logo. */
export default function ChannelLogo({ channel, size = 'md', className }: { channel: Pick<VerifiedChannel, 'id' | 'name' | 'logo'>; size?: keyof typeof SIZES; className?: string }) {
  const [ok, setOk] = useState(Boolean(channel.logo));
  if (ok && channel.logo) {
    return (
      <span className={cn('flex shrink-0 items-center justify-center overflow-hidden bg-white p-1.5 ring-1 ring-black/5', SIZES[size], className)}>
        <img src={channel.logo} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setOk(false)} className="max-h-full max-w-full object-contain" />
      </span>
    );
  }
  return (
    <span aria-hidden className={cn('flex shrink-0 items-center justify-center bg-gradient-to-br font-extrabold text-white', tileGradient(channel.id), SIZES[size], className)}>
      {initials(channel.name)}
    </span>
  );
}
