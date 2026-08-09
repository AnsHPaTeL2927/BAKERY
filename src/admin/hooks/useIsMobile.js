import { useEffect, useState } from 'react';

// Shared mobile/desktop split for components that need to render genuinely
// different UI (bottom sheet vs. popover, card vs. table) rather than just
// restyle with CSS. Matches Tailwind's `sm:` breakpoint (640px) so it agrees
// with the rest of the admin panel's responsive classes.
export default function useIsMobile(breakpointPx = 640) {
  const query = `(max-width: ${breakpointPx - 1}px)`;
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false));

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e) => setIsMobile(e.matches);
    setIsMobile(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breakpointPx]);

  return isMobile;
}
