const STYLES = {
  LIVE: 'bg-emerald-100 text-emerald-700',
  DRAFT: 'bg-amber-100 text-amber-700',
  HIDDEN: 'bg-cocoa-soft/20 text-cocoa-soft',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${STYLES[status] || STYLES.HIDDEN}`}>
      {status}
    </span>
  );
}
