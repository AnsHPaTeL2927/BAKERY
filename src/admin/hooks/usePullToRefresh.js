import { useEffect, useRef, useState } from 'react';

// Admin pages scroll at the window/body level (no fixed-height inner scroll
// container per page), so this listens on `window` and gates on
// window.scrollY === 0, rather than requiring a dedicated scroll container —
// matches how the app actually lays out today.
//
// Returns { pullDistance, refreshing, progress } — the caller renders its own
// pull indicator (spinner/icon) sized off `progress` (0–1) and calls nothing
// else; `onRefresh` fires automatically once the gesture crosses `threshold`.
export function usePullToRefresh(onRefresh, { threshold = 70, enabled = true } = {}) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const dragState = useRef({ startY: 0, dragging: false });
  const refreshingRef = useRef(false);

  useEffect(() => {
    if (!enabled) return undefined;

    function scrollTop() {
      return window.scrollY || document.documentElement.scrollTop || 0;
    }

    function onTouchStart(e) {
      if (scrollTop() > 0 || refreshingRef.current) return;
      dragState.current = { startY: e.touches[0].clientY, dragging: true };
    }

    function onTouchMove(e) {
      if (!dragState.current.dragging) return;
      const delta = e.touches[0].clientY - dragState.current.startY;
      if (delta <= 0) {
        setPullDistance(0);
        return;
      }
      // Resistance curve so the indicator eases rather than tracking 1:1 with the finger.
      setPullDistance(Math.min(Math.sqrt(delta) * 6, threshold * 1.6));
    }

    function onTouchEnd() {
      if (!dragState.current.dragging) return;
      dragState.current.dragging = false;
      setPullDistance((current) => {
        if (current >= threshold) {
          refreshingRef.current = true;
          setRefreshing(true);
          Promise.resolve(onRefresh()).finally(() => {
            refreshingRef.current = false;
            setRefreshing(false);
          });
        }
        return 0;
      });
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRefresh, threshold, enabled]);

  return { pullDistance, refreshing, progress: Math.min(1, pullDistance / threshold) };
}
