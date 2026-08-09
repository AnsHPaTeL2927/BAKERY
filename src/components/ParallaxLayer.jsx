import { useRef, useEffect, useState, useCallback } from "react";

// Lightweight parallax layer using CSS transforms and requestAnimationFrame.
// Moves its children based on scroll position at a configurable speed.
// Automatically disables on mobile and when prefers-reduced-motion is set.
//
// Props:
//   speed   – parallax intensity, e.g. 0.1 = slow, 0.5 = fast (default 0.15)
//   direction – "vertical" | "horizontal" (default "vertical")
//   className – extra classes
//   as      – element tag (default "div")
//   disableOnMobile – disable below this breakpoint in px (default 768)

export default function ParallaxLayer({
  children,
  speed = 0.15,
  direction = "vertical",
  className = "",
  as: Tag = "div",
  disableOnMobile = 768,
  style: styleProp,
  ...rest
}) {
  const ref = useRef(null);
  const [offset, setOffset] = useState(0);
  const [enabled, setEnabled] = useState(true);
  const rafRef = useRef(null);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mql.matches) { setEnabled(false); return; }

    function checkWidth() {
      setEnabled(window.innerWidth >= disableOnMobile);
    }
    checkWidth();
    window.addEventListener("resize", checkWidth);
    const handler = (e) => { if (e.matches) setEnabled(false); };
    mql.addEventListener("change", handler);

    return () => {
      window.removeEventListener("resize", checkWidth);
      mql.removeEventListener("change", handler);
    };
  }, [disableOnMobile]);

  const handleScroll = useCallback(() => {
    if (!ref.current || !enabled) return;
    const rect = ref.current.getBoundingClientRect();
    const windowH = window.innerHeight;
    // Only compute when element is near the viewport
    if (rect.bottom < -200 || rect.top > windowH + 200) return;
    const center = rect.top + rect.height / 2;
    const delta = (center - windowH / 2) * speed;
    setOffset(delta);
  }, [speed, enabled]);

  useEffect(() => {
    if (!enabled) { setOffset(0); return; }

    function onScroll() {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        handleScroll();
        rafRef.current = null;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    handleScroll(); // initial position
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [handleScroll, enabled]);

  const transform = enabled
    ? direction === "horizontal"
      ? `translate3d(${offset}px, 0, 0)`
      : `translate3d(0, ${offset}px, 0)`
    : undefined;

  const style = {
    ...styleProp,
    transform,
    willChange: enabled ? "transform" : undefined,
  };

  return (
    <Tag ref={ref} className={className} style={style} {...rest}>
      {children}
    </Tag>
  );
}
