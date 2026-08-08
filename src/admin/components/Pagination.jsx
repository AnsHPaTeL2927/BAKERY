import PaginationSelect from '../../components/PaginationSelect';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const THEMES = {
  public: {
    text: 'text-cocoa-soft',
    label: 'text-cocoa-soft/70',
    ellipsis: 'text-cocoa-soft/60',
    button: 'border border-blush px-4 py-1.5 font-semibold text-cocoa disabled:opacity-40',
    pageDefault: 'border border-blush text-cocoa hover:bg-blush-soft',
    pageActive: 'bg-rose text-ivory',
  },
  admin: {
    text: 'text-admin-muted',
    label: 'text-admin-muted',
    ellipsis: 'text-admin-muted',
    button: 'border border-admin-border px-4 py-1.5 font-semibold text-admin-text disabled:opacity-40 hover:bg-admin-bg',
    pageDefault: 'border border-admin-border text-admin-text hover:bg-admin-bg',
    pageActive: 'bg-admin-primary text-white',
  },
};

export default function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange, theme = 'public' }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;

  const t = THEMES[theme] || THEMES.public;
  const rangeStart = (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  const pageNumbers = windowedPages(page, totalPages);

  return (
    <div className={`mt-6 flex flex-wrap items-center justify-between gap-4 text-sm ${t.text}`}>
      <div className="flex items-center gap-4">
        <span>
          Showing {rangeStart}–{rangeEnd} of {total}
        </span>
        {onPageSizeChange && (
          <label className="flex flex-wrap items-center gap-2.5">
            <span className={`text-xs ${t.label}`}>Rows per page</span>
            <PaginationSelect
              theme={theme}
              value={pageSize}
              onChange={(v) => onPageSizeChange(Number(v))}
              options={PAGE_SIZE_OPTIONS}
            />
          </label>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className={`rounded-full ${t.button}`}
          >
            Previous
          </button>

          {pageNumbers.map((entry, index) =>
            entry === '…' ? (
              <span key={`ellipsis-${index}`} className={`px-2 ${t.ellipsis}`}>
                …
              </span>
            ) : (
              <button
                key={entry}
                type="button"
                onClick={() => onPageChange(entry)}
                aria-current={entry === page ? 'page' : undefined}
                className={`h-8 w-8 rounded-full text-xs font-semibold transition-colors ${
                  entry === page ? t.pageActive : t.pageDefault
                }`}
              >
                {entry}
              </button>
            ),
          )}

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className={`rounded-full ${t.button}`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

// Builds a windowed page-number list (max 5 numbers) with first/last always
// visible and "…" gaps, so pagination stays compact on catalogs with many pages.
function windowedPages(page, totalPages) {
  const maxVisible = 5;
  if (totalPages <= maxVisible + 2) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = new Set([1, totalPages, page]);
  for (let offset = 1; offset <= 1; offset += 1) {
    if (page - offset > 1) pages.add(page - offset);
    if (page + offset < totalPages) pages.add(page + offset);
  }

  const sorted = Array.from(pages).sort((a, b) => a - b);
  const withGaps = [];
  sorted.forEach((num, index) => {
    if (index > 0 && num - sorted[index - 1] > 1) withGaps.push('…');
    withGaps.push(num);
  });
  return withGaps;
}
