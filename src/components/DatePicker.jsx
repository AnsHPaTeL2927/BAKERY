import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from "lucide-react";

// No native <input type="date"> anywhere — this renders the same themed
// calendar popover on both the public site and the admin panel, just with a
// different token set, so we don't pull in a date-picker dependency for what
// is fundamentally a small, fully custom calendar grid.
const THEMES = {
  public: {
    trigger: "border-blush bg-white text-cocoa focus:border-rose",
    icon: "text-rose-deep",
    panel: "border-blush/70 bg-ivory",
    divider: "border-blush/60",
    headerText: "text-cocoa",
    navBtn: "text-cocoa-soft hover:bg-blush-soft",
    weekday: "text-cocoa-soft/60",
    dayDefault: "text-cocoa hover:bg-blush-soft",
    daySelected: "bg-rose text-ivory hover:bg-rose-deep",
    dayToday: "border border-rose text-rose-deep",
    dayMuted: "text-cocoa-soft/25",
    dayDisabled: "text-cocoa-soft/20 cursor-not-allowed",
  },
  admin: {
    trigger: "border-admin-border bg-admin-card text-admin-text focus:border-admin-primary",
    icon: "text-admin-primary",
    panel: "border-admin-border bg-admin-card",
    divider: "border-admin-border",
    headerText: "text-admin-text",
    navBtn: "text-admin-muted hover:bg-admin-bg",
    weekday: "text-admin-muted/70",
    dayDefault: "text-admin-text hover:bg-admin-bg",
    daySelected: "bg-admin-primary text-white hover:bg-admin-primary-hover",
    dayToday: "border border-admin-primary text-admin-primary",
    dayMuted: "text-admin-muted/25",
    dayDisabled: "text-admin-muted/25 cursor-not-allowed",
  },
};

function toISODate(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseISODate(value) {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function isSameDay(a, b) {
  return Boolean(a) && Boolean(b) && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function DatePicker({
  value,
  onChange,
  min,
  placeholder = "Select date",
  theme = "public",
  time,
  onTimeChange,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => parseISODate(value) || new Date());
  const ref = useRef(null);
  const t = THEMES[theme] || THEMES.public;

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    const parsed = parseISODate(value);
    if (parsed) setViewDate(parsed);
  }, [value]);

  const selected = parseISODate(value);
  const minDate = parseISODate(min);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push({ day: daysInPrevMonth - firstWeekday + 1 + i, muted: true });
  }
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push({ day: d, date: new Date(year, month, d) });
  }
  const remainder = cells.length % 7;
  if (remainder !== 0) {
    for (let d = 1; d <= 7 - remainder; d += 1) {
      cells.push({ day: d, muted: true });
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function selectDay(date) {
    if (minDate && date < minDate) return;
    onChange(toISODate(date));
    if (!onTimeChange) setOpen(false);
  }

  const label = selected
    ? selected.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
    : placeholder;

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between gap-2 rounded-2xl border px-4 py-2.5 text-sm transition-colors ${t.trigger}`}
      >
        <span className={selected ? "" : "opacity-60"}>
          {label}
          {onTimeChange && time ? ` · ${time}` : ""}
        </span>
        <CalendarIcon className={`h-4 w-4 shrink-0 ${t.icon}`} />
      </button>

      {open && (
        <div className={`absolute z-30 mt-2 w-72 rounded-2xl border p-4 shadow-lg ${t.panel}`}>
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className={`rounded-full p-1.5 ${t.navBtn}`}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className={`text-sm font-semibold ${t.headerText}`}>
              {viewDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </p>
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className={`rounded-full p-1.5 ${t.navBtn}`}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className={`mb-1 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase ${t.weekday}`}>
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell, i) => {
              if (cell.muted) {
                return (
                  <span key={i} className={`flex h-8 w-8 items-center justify-center text-xs ${t.dayMuted}`}>
                    {cell.day}
                  </span>
                );
              }
              const disabled = Boolean(minDate) && cell.date < minDate;
              const isSelected = isSameDay(cell.date, selected);
              const isToday = isSameDay(cell.date, today);
              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled}
                  onClick={() => selectDay(cell.date)}
                  className={`h-8 w-8 rounded-full text-xs font-medium transition-colors ${
                    disabled ? t.dayDisabled : isSelected ? t.daySelected : isToday ? t.dayToday : t.dayDefault
                  }`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          {onTimeChange && (
            <div className={`mt-3 flex items-center gap-2 border-t pt-3 ${t.divider}`}>
              <Clock className={`h-4 w-4 shrink-0 ${t.icon}`} />
              <input
                type="time"
                value={time || ""}
                onChange={(e) => onTimeChange(e.target.value)}
                className={`flex-1 rounded-xl border px-2 py-1.5 text-sm ${t.trigger}`}
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${t.daySelected}`}
              >
                Done
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
