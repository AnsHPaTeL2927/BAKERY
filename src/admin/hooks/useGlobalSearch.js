import { useEffect, useState } from 'react';
import { Tags, Cake, Images, BadgePercent } from 'lucide-react';
import { categoriesApi, productsApi, galleryApi, offersApi } from '../services/adminApi';

export const SEARCH_GROUPS = [
  { key: 'categories', label: 'Categories', icon: Tags, path: '/admin/categories', api: categoriesApi, labelOf: (i) => i.name },
  { key: 'products', label: 'Products', icon: Cake, path: '/admin/products', api: productsApi, labelOf: (i) => i.name },
  { key: 'gallery', label: 'Gallery', icon: Images, path: '/admin/gallery', api: galleryApi, labelOf: (i) => i.alt || i.category || `Image #${i.id}` },
  { key: 'offers', label: 'Offers', icon: BadgePercent, path: '/admin/offers', api: offersApi, labelOf: (i) => i.title },
];

// Shared debounced cross-module search — used by both the desktop GlobalSearch
// bar and the mobile MobileSearchSheet so the query/fetch logic exists once.
export function useGlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }
    const timeout = setTimeout(async () => {
      const settled = await Promise.all(
        SEARCH_GROUPS.map((group) =>
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

  return { query, setQuery, results };
}
