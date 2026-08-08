import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

const THEMES = {
  public: {
    trigger: "border-blush bg-white text-cocoa focus:border-rose",
    icon: "text-rose-deep",
    panel: "border-blush/70 bg-ivory",
    optionHover: "hover:bg-blush-soft",
    optionSelected: "bg-blush-soft font-semibold text-rose-deep",
    optionDefault: "text-cocoa",
    placeholder: "text-cocoa-soft/60",
  },
  admin: {
    trigger: "border-admin-border bg-admin-card text-admin-text focus:border-admin-primary",
    icon: "text-admin-primary",
    panel: "border-admin-border bg-admin-card",
    optionHover: "hover:bg-admin-bg",
    optionSelected: "bg-admin-primary/10 font-semibold text-admin-primary",
    optionDefault: "text-admin-text",
    placeholder: "text-admin-muted",
  },
};

function normalizeOptions(options) {
  return options.map((o) => (typeof o === "object" && o !== null ? o : { value: o, label: o }));
}

export default function ThemedSelect({ value, onChange, options, placeholder = "Select an option", theme = "public", className = "" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const t = THEMES[theme] || THEMES.public;
  const normalized = normalizeOptions(options);
  const selected = normalized.find((o) => o.value === value);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between gap-2 rounded-2xl border px-4 py-2.5 text-sm transition-colors ${t.trigger}`}
      >
        <span className={selected ? "" : t.placeholder}>{selected ? selected.label : placeholder}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${t.icon} ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className={`absolute z-30 mt-2 w-full max-h-64 overflow-y-auto rounded-2xl border shadow-lg ${t.panel}`}>
          {normalized.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`block w-full px-4 py-2.5 text-left text-sm transition-colors ${t.optionHover} ${
                option.value === value ? t.optionSelected : t.optionDefault
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
