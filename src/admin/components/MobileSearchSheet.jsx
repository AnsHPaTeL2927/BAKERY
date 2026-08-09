import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useGlobalSearch } from '../hooks/useGlobalSearch';
import BottomSheet from './BottomSheet';

// Mobile's entry point into the same search GlobalSearch provides on desktop
// — below 640px the inline bar has no room, so this opens as a near-full-height
// bottom sheet instead, reusing the exact same query/fetch hook.
export default function MobileSearchSheet({ open, onClose }) {
  const { query, setQuery, results } = useGlobalSearch();
  const navigate = useNavigate();

  function goTo(path) {
    setQuery('');
    onClose();
    navigate(path);
  }

  return (
    <BottomSheet open={open} title="Search" onClose={onClose} maxHeightClass="max-h-[92vh]">
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-muted" />
        {/* autoFocus is intentional here: the sheet only mounts once the admin has
            explicitly tapped the search icon, so immediately opening the keyboard
            is expected, not a surprise. */}
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products, categories…"
          className="w-full rounded-xl border border-admin-border bg-admin-bg py-3 pl-10 pr-3 text-base text-admin-text placeholder:text-admin-muted focus:border-admin-primary focus:outline-none"
        />
      </div>

      {query.trim().length < 2 && <p className="py-8 text-center text-sm text-admin-muted">Type at least 2 characters to search.</p>}
      {query.trim().length >= 2 && results === null && <p className="py-8 text-center text-sm text-admin-muted">Searching…</p>}
      {results !== null && results.length === 0 && (
        <p className="py-8 text-center text-sm text-admin-muted">No matches for "{query}"</p>
      )}
      {results?.map((group) => (
        <div key={group.key} className="mb-2 last:mb-0">
          <p className="px-1 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-admin-muted">{group.label}</p>
          {group.items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => goTo(group.path)}
              className="flex w-full items-center gap-3 rounded-xl px-2.5 py-3 text-left text-sm text-admin-text active:bg-admin-bg"
            >
              <group.icon className="h-4 w-4 shrink-0 text-admin-primary" />
              <span className="truncate">{group.labelOf(item)}</span>
            </button>
          ))}
        </div>
      ))}
    </BottomSheet>
  );
}
