import { Search, X } from 'lucide-react';

export default function SearchBar({ value, onChange, total }: { value: string; onChange: (v: string) => void; total: number }) {
  return (
    <div className="relative px-4">
      <Search className="pointer-events-none absolute left-8 top-1/2 h-5 w-5 -translate-y-1/2 text-tv-muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Search ${total.toLocaleString()} channels, countries…`}
        aria-label="Search channels"
        className="h-12 w-full rounded-2xl border border-tv-line bg-tv-surface pl-12 pr-10 text-[15px] text-tv-fg shadow-sm placeholder:text-tv-muted focus:border-tv-accent focus:outline-none focus:ring-4 focus:ring-tv-accent/15"
      />
      {value && (
        <button type="button" onClick={() => onChange('')} aria-label="Clear search" className="absolute right-7 top-1/2 -translate-y-1/2 p-1 text-tv-muted">
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
