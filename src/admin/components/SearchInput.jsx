import { Search } from 'lucide-react';

export default function SearchInput({ value, onChange, placeholder = 'Search…' }) {
  return (
    <div className="relative w-full max-w-xs">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cocoa-soft/60" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-blush py-2.5 pl-9 pr-3 text-base sm:text-sm font-medium text-admin-text placeholder:text-admin-muted bg-admin-card focus:outline-none"
      />
    </div>
  );
}
