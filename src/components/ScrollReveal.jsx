import { useRef, useEffect, useState, useCallback } from "react";

// Reusable scroll-reveal wrapper. Uses Intersection Observer to trigger a
// one-shot CSS transition when the element scrolls into view. Respects
// `prefers-reduced-motion` automatically — when enabled, elements appear
// instantly with no movement.
//
// Props:
//   direction  – "up" | "down" | "left" | "right" | "none" (default "up")
//   delay      – ms delay before the reveal starts (default 0)
//   duration   – ms transition duration (default 700)
//   distance   – px distance for the translate (default 32)
//   threshold  – 0–1 how much of the element must be visible (default 0.15)
//   once       – if true (default), only reveal once; if false, re-hide when leaving
//   className  – extra classes on the wrapper
//   as         – element tag (default "div")
//   stagger    – ms stagger increment per child index (for parent usage)
//   index      – child index for stagger calculation

const DIRECTION_MAP = {
  up:    (d) => `translateY(${d}px)`,
  down:  (d) => `translateY(-${d}px)`,
  left:  (d) => `translateX(${d}px)`,
  right: (d) => `translateX(-${d}px)`,
  none:  ()  => "none",
};

export default function ScrollReveal({
  children,
  direction = "up",
  delay = 0,
  duration = 700,
  distance = 32,
  threshold = 0.15,
  once = true,
  className = "",
  as: Tag = "div",
  stagger = 0,
  index = 0,
  style: styleProp,
  ...rest
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mql.matches);
    const handler = (e) => setPrefersReduced(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const handleIntersect = useCallback(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.unobserve(entry.target);
        } else if (!once) {
          setVisible(false);
        }
      });
    },
    [once]
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleIntersect, {
      threshold: Math.min(Math.max(threshold, 0), 1),
      rootMargin: "0px 0px -40px 0px",
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersect, threshold]);

  const totalDelay = delay + stagger * index;

  // If user prefers reduced motion, skip all transforms/transitions
  if (prefersReduced) {
    return (
      <Tag ref={ref} className={className} style={styleProp} {...rest}>
        {children}
      </Tag>
    );
  }

  const getTransform = DIRECTION_MAP[direction] || DIRECTION_MAP.up;

  const style = {
    ...styleProp,
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0) translateX(0)" : getTransform(distance),
    transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${totalDelay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${totalDelay}ms`,
    willChange: visible ? "auto" : "opacity, transform",
  };

  return (
    <Tag ref={ref} className={className} style={style} {...rest}>
      {children}
    </Tag>
  );
}
