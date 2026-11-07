import { cn } from '@/lib/utils';

export default function SectionHeader({ icon, title, meta, className }: { icon?: React.ReactNode; title: string; meta?: string; className?: string }) {
  return (
    <div className={cn('mb-3 flex items-center gap-2 px-4', className)}>
      {icon && <span className="text-tv-accent">{icon}</span>}
      <h2 className="flex-1 truncate text-[15px] font-bold text-tv-fg">{title}</h2>
      {meta && <span className="font-mono text-xs text-tv-muted">{meta}</span>}
    </div>
  );
}
