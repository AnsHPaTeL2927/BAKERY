import { useEffect, useState, useMemo } from "react";

/**
 * Lightweight, GPU-accelerated cinematic particle overlay.
 * Renders floating gold specks & subtle ambient bokeh light spots.
 * Automatically respects `prefers-reduced-motion`.
 */
export default function CinematicParticles({ particleCount = 18, className = "" }) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mql.matches);
    const handler = (e) => setReducedMotion(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const particles = useMemo(() => {
    return Array.from({ length: particleCount }).map((_, i) => ({
      id: i,
      left: `${(i * 17 + (i % 5) * 19) % 94 + 3}%`,
      top: `${(i * 23 + (i % 7) * 13) % 90 + 5}%`,
      size: i % 3 === 0 ? 3 : i % 2 === 0 ? 2 : 1.5,
      duration: 6 + (i % 5) * 2.5,
      delay: (i % 7) * 0.8,
      opacity: 0.35 + (i % 4) * 0.15,
      blur: i % 4 === 0 ? "1px" : "0px",
    }));
  }, [particleCount]);

  if (reducedMotion) return null;

  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 pointer-events-none overflow-hidden z-10 ${className}`}
    >
      {/* Floating Golden Dust Specks */}
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full bg-gradient-to-t from-gold via-blush to-ivory animate-cinematic-float"
          style={{
            left: p.left,
            top: p.top,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
            filter: p.blur !== "0px" ? `blur(${p.blur})` : undefined,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            boxShadow: "0 0 6px rgba(235, 190, 110, 0.8)",
          }}
        />
      ))}

      {/* Soft Ambient Bokeh Orbs */}
      <div className="absolute top-1/4 left-1/4 w-36 h-36 rounded-full bg-gold/15 blur-2xl animate-gentle-pulse pointer-events-none" />
      <div
        className="absolute bottom-1/3 right-10 w-44 h-44 rounded-full bg-rose/15 blur-3xl animate-gentle-pulse pointer-events-none"
        style={{ animationDelay: "2s" }}
      />
    </div>
  );
}
