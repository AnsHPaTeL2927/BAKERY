import { useEffect, useState } from "react";

// Lightweight, dependency-free "3D" decorative cake accent for the Hero
// section. Built entirely from CSS (layered divs + translateZ/rotate), not a
// WebGL/GLTF model — no new bundle weight, no asset pipeline, and every
// animated property is transform/opacity (GPU-friendly, cheap on low-end
// mobile). Tilts toward the cursor on desktop (via the same mousePos the
// hero text/image already track), bobs gently at idle using the existing
// `.animate-float-slow` / `.animate-float` utilities, and collapses to a
// fully static presentation under prefers-reduced-motion (never unmounted —
// the hero should never look like it's missing a piece).
export default function HeroCakeAccent({ mousePos = { x: 0, y: 0 }, className = "" }) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mql.matches);
    const handler = (e) => setReducedMotion(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const tilt = reducedMotion
    ? undefined
    : `rotateX(${mousePos.y * -6}deg) rotateY(${mousePos.x * 10}deg)`;

  return (
    <div aria-hidden="true" className={`pointer-events-none select-none ${className}`} style={{ perspective: "800px" }}>
      <div
        className={`relative w-full h-full transition-transform duration-300 ease-out ${!reducedMotion ? "animate-float-slow" : ""}`}
        style={{ transformStyle: "preserve-3d", transform: tilt }}
      >
        {/* Ambient gold specks — drawn, not emoji: the accent has to read as a
            considered brand mark on a professional site, and pasted emoji
            render differently on every platform anyway. */}
        <span
          className={`absolute -top-1 -right-1 w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-gold/80 ${
            !reducedMotion ? "animate-gentle-pulse" : ""
          }`}
          style={{ animationDelay: "0.3s" }}
        />
        <span
          className={`absolute top-5 -left-3 w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-gold/60 ${
            !reducedMotion ? "animate-gentle-pulse" : ""
          }`}
        />

        {/* candle + flame, both CSS shapes */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-6 md:-top-7 w-1 md:w-1.5 h-5 md:h-6 rounded-full bg-gold shadow-sm">
          <span
            className={`absolute -top-2 left-1/2 -translate-x-1/2 w-1.5 h-2.5 md:w-2 md:h-3 bg-gradient-to-t from-gold to-blush ${
              !reducedMotion ? "animate-gentle-pulse" : ""
            }`}
            style={{ borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%" }}
          />
        </div>

        {/* tiers — stacked back-to-front with translateZ for depth */}
        <div
          className="w-20 h-7 md:w-24 md:h-8 mx-auto rounded-2xl bg-gradient-to-br from-cream to-blush-soft shadow-lg shadow-cocoa/10 border border-blush/60"
          style={{ transform: "translateZ(30px)" }}
        />
        <div
          className="w-28 h-9 md:w-32 md:h-10 mx-auto -mt-1 rounded-2xl bg-gradient-to-br from-blush to-rose/70 shadow-lg shadow-cocoa/15 border border-rose/30"
          style={{ transform: "translateZ(10px)" }}
        />
        <div
          className="w-36 h-10 md:w-40 md:h-12 mx-auto -mt-1 rounded-2xl bg-gradient-to-br from-rose-deep to-rose shadow-xl shadow-cocoa/20"
          style={{ transform: "translateZ(-10px)" }}
        />
      </div>
    </div>
  );
}
