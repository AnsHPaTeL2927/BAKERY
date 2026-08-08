import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

// Purpose-built for the pagination "rows per page" control specifically —
// fixed 120px width, height matched to the filter inputs beside it, and a
// dropdown panel that's exactly as wide as its trigger and centered under
// it, none of which the generic ThemedSelect guarantees.
const THEMES = {
  public: {
    trigger: "border-blush bg-white text-cocoa hover:border-rose focus:border-rose",
    icon: "text-rose-deep",
    panel: "border-blush/70 bg-ivory",
    optionHover: "hover:bg-blush-soft",
    optionSelected: "bg-rose text-ivory",
    optionDefault: "text-cocoa",
  },
  admin: {
    trigger: "border-admin-border bg-admin-card text-admin-text hover:border-admin-primary focus:border-admin-primary",
    icon: "text-admin-primary",
    panel: "border-admin-border bg-admin-card",
    optionHover: "hover:bg-admin-bg",
    optionSelected: "bg-admin-primary text-white",
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
        style={{ borderRadius: 14 }}
        className={`flex h-10 w-full items-center justify-between gap-2 border px-3.5 text-sm font-semibold transition-colors duration-200 ${t.trigger}`}
      >
        <span>{value}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${t.icon} ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          style={{ borderRadius: 14 }}
          className={`absolute left-0 z-30 mt-1.5 w-full origin-top overflow-hidden border shadow-lg animate-[fadeIn_0.12s_ease-out] ${t.panel}`}
        >
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
              className={`block w-full px-3.5 py-2 text-center text-sm font-semibold transition-colors duration-150 ${t.optionHover} ${
                option === value ? t.optionSelected : t.optionDefault
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
