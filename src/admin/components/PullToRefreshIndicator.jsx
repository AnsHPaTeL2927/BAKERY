import { RefreshCw } from 'lucide-react';

// Pairs with usePullToRefresh — a thin, top-anchored indicator that grows
// with pull progress and spins while refreshing. Mobile-only in practice
// (the hook only ever fires from touch events), but harmless to render
// unconditionally since pullDistance stays 0 with no touch input.
export default function PullToRefreshIndicator({ pullDistance, refreshing, progress }) {
  if (pullDistance === 0 && !refreshing) return null;

  return (
    <div
      className="flex items-center justify-center overflow-hidden transition-[height] duration-200"
      style={{ height: refreshing ? 44 : pullDistance }}
      aria-live="polite"
    >
      <RefreshCw
        className={`h-5 w-5 text-admin-primary ${refreshing ? 'animate-spin' : ''}`}
        style={refreshing ? undefined : { transform: `rotate(${progress * 360}deg)`, opacity: progress }}
      />
    </div>
  );
}
