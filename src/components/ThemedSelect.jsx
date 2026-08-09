import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePortalDropdown } from "../hooks/usePortalDropdown";

const THEMES = {
  public: {
    trigger: "border-blush bg-ivory text-cocoa focus:border-rose rounded-2xl px-4 py-2.5",
    icon: "text-rose-deep",
    panel: "border-blush/70 bg-ivory rounded-2xl p-1.5 shadow-2xl shadow-cocoa/10",
    optionHover: "hover:bg-blush-soft/80 rounded-xl",
    optionSelected: "bg-blush-soft font-semibold text-rose-deep rounded-xl",
    optionDefault: "text-cocoa rounded-xl",
    placeholder: "text-cocoa-soft/60",
  },
  admin: {
    trigger: "border-admin-border bg-admin-card text-admin-text hover:border-admin-primary/60 focus:border-admin-primary rounded-xl px-3.5 py-2.5 text-sm font-medium shadow-sm",
    icon: "text-admin-primary",
    panel: "border-admin-border bg-admin-card rounded-2xl p-1.5 shadow-2xl shadow-cocoa/10",
    optionHover: "hover:bg-admin-bg rounded-xl",
    optionSelected: "bg-admin-primary/10 font-semibold text-admin-primary rounded-xl",
    optionDefault: "text-admin-text rounded-xl",
    placeholder: "text-admin-muted",
  },
};

function normalizeOptions(options) {
  return (options || []).map((o) => (typeof o === "object" && o !== null ? o : { value: o, label: o }));
}

export default function ThemedSelect({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  theme = "public",
  className = "",
}) {
  const t = THEMES[theme] || THEMES.public;
  const normalized = normalizeOptions(options);
  const selected = normalized.find((o) => String(o.value) === String(value));

  // Portal-based smart positioning — opens up when near the bottom of viewport/modal
  const { triggerRef, dropdownRef, open, toggle, close, portalStyle, openUpward } =
    usePortalDropdown({ estimatedHeight: Math.min(260, normalized.length * 44 + 16) });

  return (
    <div className={`relative ${className}`}>
      {/* TRIGGER BUTTON */}
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        className={`flex w-full items-center justify-between gap-2 border text-sm transition-all duration-200 ${t.trigger} ${
          open
            ? theme === "admin"
              ? "ring-2 ring-admin-primary/20 border-admin-primary"
              : "ring-2 ring-rose/20 border-rose"
            : ""
        }`}
      >
        <span className={`truncate ${selected ? "" : t.placeholder}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${t.icon} ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* PORTAL PANEL — always renders in document.body at fixed viewport coords */}
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div ref={dropdownRef} style={portalStyle}>
            <AnimatePresence>
              <motion.div
                key="themed-select-panel"
                initial={{ opacity: 0, y: openUpward ? 6 : -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: openUpward ? 6 : -6, scale: 0.97 }}
                transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className={`max-h-64 overflow-y-auto border ${t.panel}`}
              >
                {normalized.map((option) => {
                  const isSelected = String(option.value) === String(value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        onChange(option.value);
                        close();
                      }}
                      className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors duration-150 ${
                        t.optionHover
                      } ${isSelected ? t.optionSelected : t.optionDefault}`}
                    >
                      <span className="truncate">{option.label}</span>
                      {isSelected && <Check className={`h-4 w-4 shrink-0 ${t.icon}`} />}
                    </button>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>,
          document.body
        )}
    </div>
  );
}
