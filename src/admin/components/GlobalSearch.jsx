import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Tags, Cake, Images, BadgePercent } from 'lucide-react';
import { categoriesApi, productsApi, galleryApi, offersApi } from '../services/adminApi';

const GROUPS = [
  { key: 'categories', label: 'Categories', icon: Tags, path: '/admin/categories', api: categoriesApi, labelOf: (i) => i.name },
  { key: 'products', label: 'Products', icon: Cake, path: '/admin/products', api: productsApi, labelOf: (i) => i.name },
  { key: 'gallery', label: 'Gallery', icon: Images, path: '/admin/gallery', api: galleryApi, labelOf: (i) => i.alt || i.category || `Image #${i.id}` },
  { key: 'offers', label: 'Offers', icon: BadgePercent, path: '/admin/offers', api: offersApi, labelOf: (i) => i.title },
];

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }
    const timeout = setTimeout(async () => {
      const settled = await Promise.all(
        GROUPS.map((group) =>
          group.api
            .list({ search: query.trim(), page: 1, pageSize: 4 })
            .then((data) => ({ ...group, items: data.items }))
            .catch(() => ({ ...group, items: [] })),
        ),
      );
      setResults(settled.filter((g) => g.items.length > 0));
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function goTo(path) {
    setOpen(false);
    setQuery('');
    navigate(path);
  }

  return (
    <div ref={rootRef} className="relative hidden w-full max-w-xs sm:block">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-muted" />
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search products, categories…"
        className="w-full rounded-xl border border-admin-border bg-admin-bg py-2.5 pl-10 pr-3 text-sm text-admin-text placeholder:text-admin-muted focus:border-admin-primary focus:outline-none"
      />

      <AnimatePresence>
        {open && query.trim().length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 z-30 mt-2 max-h-96 overflow-y-auto rounded-admin border border-admin-border bg-admin-card p-2 shadow-xl"
          >
            {results === null && <p className="px-3 py-4 text-center text-sm text-admin-muted">Searching…</p>}
            {results !== null && results.length === 0 && (
              <p className="px-3 py-4 text-center text-sm text-admin-muted">No matches for "{query}"</p>
            )}
            {results?.map((group) => (
              <div key={group.key} className="mb-1 last:mb-0">
                <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-admin-muted">{group.label}</p>
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goTo(group.path)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-admin-text hover:bg-admin-bg"
                  >
                    <group.icon className="h-4 w-4 shrink-0 text-admin-primary" />
                    <span className="truncate">{group.labelOf(item)}</span>
                  </button>
                ))}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
