import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Purpose-built for the pagination "rows per page" control specifically —
// sleek, compact, opens upwards with soft pastel admin theme styling, rounded options,
// and check indicators instead of harsh solid block fills.
const THEMES = {
  public: {
    trigger: "border-blush bg-white text-cocoa hover:border-rose focus:border-rose shadow-sm",
    icon: "text-rose-deep",
    panel: "border-blush/70 bg-ivory shadow-xl",
    optionHover: "hover:bg-blush-soft",
    optionSelected: "bg-rose/10 font-semibold text-rose-deep",
    optionDefault: "text-cocoa",
  },
  admin: {
    trigger: "border-admin-border bg-admin-card text-admin-text hover:border-admin-primary/60 focus:border-admin-primary shadow-sm",
    icon: "text-admin-primary",
    panel: "border-admin-border bg-admin-card shadow-xl shadow-cocoa/5",
    optionHover: "hover:bg-admin-bg",
    optionSelected: "bg-admin-primary/10 font-semibold text-admin-primary",
    optionDefault: "text-admin-text",
  },
};

export default function PaginationSelect({ value, onChange, options, theme = "public" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const t = THEMES[theme] || THEMES.public;

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative w-[120px] shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex h-10 w-full items-center justify-between gap-2 rounded-xl border px-3.5 text-sm font-semibold transition-all duration-200 ${t.trigger}`}
      >
        <span>{value}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${t.icon} ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute bottom-full left-0 z-50 mb-2 w-full origin-bottom overflow-hidden rounded-2xl border p-1.5 shadow-xl ${t.panel}`}
          >
            {options.map((option) => {
              const isSelected = String(option) === String(value);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition-colors duration-150 ${t.optionHover} ${
                    isSelected ? t.optionSelected : t.optionDefault
                  }`}
                >
                  <span>{option}</span>
                  {isSelected && <Check className={`h-3.5 w-3.5 shrink-0 ${t.icon}`} />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
