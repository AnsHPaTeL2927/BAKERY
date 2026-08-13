import { useState } from "react";
import { Star } from "lucide-react";

const SIZES = {
  sm: "w-3.5 h-3.5",
  md: "w-4 h-4",
  lg: "w-6 h-6",
  xl: "w-8 h-8",
};

// Read-only star display. Supports fractional values (e.g. an average of 4.6)
// by clipping a filled row over an empty one — no half-star glyph needed.
export function StarRatingDisplay({ value = 0, size = "md", className = "", label }) {
  const clamped = Math.max(0, Math.min(5, Number(value) || 0));
  const sizeClass = SIZES[size] || SIZES.md;

  return (
    <span className={`inline-flex items-center gap-2 ${className}`} title={label || `${clamped} out of 5`}>
      <span className="relative inline-flex" aria-hidden="true">
        <span className="inline-flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`${sizeClass} text-gold/25`} strokeWidth={1.5} />
          ))}
        </span>
        <span
          className="absolute inset-0 inline-flex gap-0.5 overflow-hidden"
          style={{ width: `${(clamped / 5) * 100}%` }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`${sizeClass} shrink-0 fill-gold text-gold`} strokeWidth={1.5} />
          ))}
        </span>
      </span>
      <span className="sr-only">{label || `Rated ${clamped} out of 5`}</span>
    </span>
  );
}

// Interactive rating input for the public "write a review" form. Keyboard
// accessible via a real radio group — arrow keys and Tab both work, and the
// selection survives with JS-driven hover preview layered on top.
export function StarRatingInput({ value = 0, onChange, name = "rating", size = "xl" }) {
  const [hovered, setHovered] = useState(0);
  const shown = hovered || value;
  const sizeClass = SIZES[size] || SIZES.xl;

  return (
    <div
      className="inline-flex items-center gap-1"
      role="radiogroup"
      aria-label="Your rating"
      onMouseLeave={() => setHovered(0)}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <label
          key={n}
          className="cursor-pointer p-1 rounded-lg transition-transform duration-200 hover:scale-110 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-rose"
          onMouseEnter={() => setHovered(n)}
        >
          <input
            type="radio"
            name={name}
            value={n}
            checked={value === n}
            onChange={() => onChange?.(n)}
            className="sr-only"
          />
          <Star
            className={`${sizeClass} transition-colors duration-200 ${
              n <= shown ? "fill-gold text-gold" : "text-blush"
            }`}
            strokeWidth={1.5}
          />
          <span className="sr-only">{n} star{n > 1 ? "s" : ""}</span>
        </label>
      ))}
    </div>
  );
}

export default StarRatingDisplay;
