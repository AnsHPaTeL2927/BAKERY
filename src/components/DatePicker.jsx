import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, X } from "lucide-react";

const THEMES = {
  public: {
    trigger: "border-blush bg-white text-cocoa focus:border-rose hover:border-rose/50",
    icon: "text-rose-deep",
    panel: "border-blush/70 bg-ivory shadow-2xl shadow-cocoa/20",
    divider: "border-blush/60",
    headerText: "text-cocoa font-bold",
    navBtn: "text-cocoa-soft hover:bg-blush-soft hover:text-rose-deep",
    weekday: "text-cocoa-soft/60",
    dayDefault: "text-cocoa hover:bg-blush-soft font-medium",
    daySelected: "bg-rose text-ivory hover:bg-rose-deep shadow-xs font-bold",
    dayToday: "border-2 border-rose text-rose-deep font-bold",
    dayMuted: "text-cocoa-soft/25",
    dayDisabled: "text-cocoa-soft/20 cursor-not-allowed",
    primaryBg: "bg-rose",
    primaryText: "text-rose-deep",
  },
  admin: {
    trigger: "border-admin-border bg-admin-card text-admin-text focus:border-admin-primary hover:border-admin-primary/60",
    icon: "text-admin-primary",
    panel: "border-admin-border bg-admin-card shadow-2xl shadow-cocoa/20",
    divider: "border-admin-border/80",
    headerText: "text-admin-text font-bold",
    navBtn: "text-admin-muted hover:bg-admin-bg hover:text-admin-text",
    weekday: "text-admin-muted/70",
    dayDefault: "text-admin-text hover:bg-admin-bg font-medium",
    daySelected: "bg-admin-primary text-white hover:bg-admin-primary-hover shadow-xs font-bold",
    dayToday: "border-2 border-admin-primary text-admin-primary font-bold",
    dayMuted: "text-admin-muted/25",
    dayDisabled: "text-admin-muted/25 cursor-not-allowed",
    primaryBg: "bg-admin-primary",
    primaryText: "text-admin-primary",
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

function formatDisplayTime(tStr) {
  if (!tStr) return "12:00 PM";
  const [h24, m] = tStr.split(":").map(Number);
  const period = (h24 || 0) >= 12 ? "PM" : "AM";
  let h12 = (h24 || 0) % 12;
  if (h12 === 0) h12 = 12;
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(h12)}:${pad(m || 0)} ${period}`;
}

export default function DatePicker({
  value,
  onChange,
  min,
  placeholder = "Select date & time",
  theme = "public",
  time,
  onTimeChange,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [clockMode, setClockMode] = useState("hour"); // "hour" | "minute"
  const [viewDate, setViewDate] = useState(() => parseISODate(value) || new Date());
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0, isMobile: false });
  const ref = useRef(null);
  const popoverRef = useRef(null);
  const t = THEMES[theme] || THEMES.public;
  const isAdmin = theme === "admin";

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        ref.current &&
        !ref.current.contains(e.target) &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const parsed = parseISODate(value);
    if (parsed) setViewDate(parsed);
  }, [value]);

  function updatePosition() {
    if (!ref.current) return;
    const mobile = window.innerWidth < 640;
    if (mobile) {
      setPopoverPos({ isMobile: true });
      return;
    }

    const rect = ref.current.getBoundingClientRect();
    const width = onTimeChange ? 530 : 290;
    const height = onTimeChange ? 380 : 330;

    let left = rect.left;
    if (left + width > window.innerWidth - 20) {
      left = Math.max(20, window.innerWidth - width - 20);
    }

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    let top;
    if (spaceBelow < height + 16 && spaceAbove >= height + 16) {
      top = rect.top - height - 8;
    } else {
      top = rect.bottom + 8;
      const maxTop = window.innerHeight - height - 20;
      if (top > maxTop) {
        top = maxTop;
      }
    }

    top = Math.max(16, top);

    setPopoverPos({
      top,
      left,
      width,
      isMobile: false,
    });
  }

  function handleToggle() {
    if (!open) {
      updatePosition();
      setClockMode("hour");
    }
    setOpen((o) => !o);
  }

  useEffect(() => {
    if (open) {
      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [open]);

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

  const parseTimeParts = (tStr) => {
    if (!tStr) return { hour12: "12", minute: "00", period: "PM" };
    const [h24, m] = tStr.split(":").map(Number);
    const period = (h24 || 0) >= 12 ? "PM" : "AM";
    let h12 = (h24 || 0) % 12;
    if (h12 === 0) h12 = 12;
    const pad = (n) => String(n).padStart(2, "0");
    return { hour12: pad(h12), minute: pad(m || 0), period };
  };

  const { hour12, minute, period } = parseTimeParts(time);

  const updateTimeParts = (newH12, newM, newP) => {
    let h24 = Number(newH12);
    if (newP === "PM" && h24 < 12) h24 += 12;
    if (newP === "AM" && h24 === 12) h24 = 0;
    const pad = (n) => String(n).padStart(2, "0");
    onTimeChange(`${pad(h24)}:${newM}`);
  };

  function handleSelectHour(hStr) {
    updateTimeParts(hStr, minute, period);
    setTimeout(() => setClockMode("minute"), 150);
  }

  function handleSelectMinute(mStr) {
    updateTimeParts(hour12, mStr, period);
  }

  function applyPreset(presetTimeStr) {
    onTimeChange(presetTimeStr);
  }

  const currentHourNum = Number(hour12) || 12;
  const hourHandAngle = currentHourNum * 30;
  const currentMinuteNum = Number(minute) || 0;
  const minuteHandAngle = currentMinuteNum * 6;

  // Popover Element
  const popoverContent = open && (
    popoverPos.isMobile ? (
      // Mobile Bottom Sheet Overlay
      <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-cocoa/40 backdrop-blur-xs p-0">
        <div
          ref={popoverRef}
          className={`w-full max-h-[85vh] overflow-y-auto rounded-t-3xl border-t p-4 shadow-2xl ${t.panel}`}
        >
          <div className="flex items-center justify-between pb-2.5 border-b border-admin-border/60">
            <span className="text-xs font-bold text-admin-text">Select Date &amp; Time</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1 text-admin-muted hover:bg-admin-bg"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 space-y-4">
            {/* Calendar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setViewDate(new Date(year, month - 1, 1))}
                  className={`rounded-full p-1 ${t.navBtn}`}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <p className={`text-xs font-bold ${t.headerText}`}>
                  {viewDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                </p>
                <button
                  type="button"
                  onClick={() => setViewDate(new Date(year, month + 1, 1))}
                  className={`rounded-full p-1 ${t.navBtn}`}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className={`grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wider ${t.weekday}`}>
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <span key={i}>{d}</span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {cells.map((cell, i) => {
                  if (cell.muted) return <span key={i} className={`flex h-7 w-7 items-center justify-center text-xs ${t.dayMuted}`}>{cell.day}</span>;
                  const disabled = Boolean(minDate) && cell.date < minDate;
                  const isSelected = isSameDay(cell.date, selected);
                  const isToday = isSameDay(cell.date, today);
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={disabled}
                      onClick={() => selectDay(cell.date)}
                      className={`h-7 w-7 rounded-full text-xs font-semibold ${
                        disabled ? t.dayDisabled : isSelected ? t.daySelected : isToday ? t.dayToday : t.dayDefault
                      }`}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Clock */}
            {onTimeChange && (
              <div className="pt-2.5 border-t border-admin-border/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-admin-muted">Time</span>
                  <div className={`text-lg font-extrabold ${isAdmin ? "text-admin-primary" : "text-rose-deep"}`}>
                    {hour12} : {minute} <span className="text-xs font-bold">{period}</span>
                  </div>
                </div>

                <div className="relative mx-auto h-40 w-40 rounded-full bg-admin-bg/80 border border-admin-border/60 flex items-center justify-center">
                  <div className="absolute h-2.5 w-2.5 rounded-full bg-admin-primary z-20" />
                  <div
                    className="absolute bottom-1/2 left-1/2 w-0.5 origin-bottom bg-admin-primary z-10"
                    style={{
                      height: "58px",
                      transform: `translateX(-50%) rotate(${clockMode === "hour" ? hourHandAngle : minuteHandAngle}deg)`,
                    }}
                  />

                  {clockMode === "hour" &&
                    Array.from({ length: 12 }, (_, i) => i + 1).map((hNum) => {
                      const hStr = String(hNum).padStart(2, "0");
                      const rad = (hNum * 30 - 90) * (Math.PI / 180);
                      const radius = 58;
                      const x = Math.round(radius * Math.cos(rad));
                      const y = Math.round(radius * Math.sin(rad));
                      const isSelected = hour12 === hStr;
                      return (
                        <button
                          key={hNum}
                          type="button"
                          onClick={() => handleSelectHour(hStr)}
                          style={{ left: `calc(50% + ${x}px - 12px)`, top: `calc(50% + ${y}px - 12px)` }}
                          className={`absolute flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                            isSelected ? "bg-admin-primary text-white shadow-md z-20" : "text-admin-text"
                          }`}
                        >
                          {hNum}
                        </button>
                      );
                    })}

                  {clockMode === "minute" &&
                    [
                      { mStr: "00", angle: 0 },
                      { mStr: "15", angle: 90 },
                      { mStr: "30", angle: 180 },
                      { mStr: "45", angle: 270 },
                    ].map((item) => {
                      const rad = (item.angle - 90) * (Math.PI / 180);
                      const radius = 58;
                      const x = Math.round(radius * Math.cos(rad));
                      const y = Math.round(radius * Math.sin(rad));
                      const isSelected = minute === item.mStr;
                      return (
                        <button
                          key={item.mStr}
                          type="button"
                          onClick={() => handleSelectMinute(item.mStr)}
                          style={{ left: `calc(50% + ${x}px - 16px)`, top: `calc(50% + ${y}px - 12px)` }}
                          className={`absolute flex h-6 w-8 items-center justify-center rounded-full text-xs font-bold ${
                            isSelected ? "bg-admin-primary text-white shadow-md z-20" : "text-admin-text"
                          }`}
                        >
                          :{item.mStr}
                        </button>
                      );
                    })}
                </div>

                <div className="flex rounded-xl border border-admin-border/80 p-0.5 bg-admin-bg">
                  {["AM", "PM"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => updateTimeParts(hour12, minute, p)}
                      className={`flex-1 py-1 text-xs font-bold rounded-lg ${
                        period === p ? "bg-admin-primary text-white shadow-xs" : "text-admin-muted"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className={`w-full rounded-xl py-2.5 text-xs font-bold ${t.daySelected}`}
                >
                  Confirm Date &amp; Time
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    ) : (
      // Desktop Viewport Fixed Portal Popover
      <div
        ref={popoverRef}
        style={{
          position: "fixed",
          top: `${popoverPos.top}px`,
          left: `${popoverPos.left}px`,
          width: popoverPos.width ? `${popoverPos.width}px` : "auto",
          zIndex: 9999,
        }}
        className={`rounded-3xl border p-3.5 shadow-2xl transition-all ${t.panel}`}
      >
        <div className={onTimeChange ? "grid gap-4 md:grid-cols-2" : ""}>
          {/* LEFT COLUMN: CALENDAR */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setViewDate(new Date(year, month - 1, 1))}
                className={`rounded-full p-1 transition-colors ${t.navBtn}`}
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <p className={`text-xs font-bold ${t.headerText}`}>
                {viewDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </p>
              <button
                type="button"
                onClick={() => setViewDate(new Date(year, month + 1, 1))}
                className={`rounded-full p-1 transition-colors ${t.navBtn}`}
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className={`grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wider ${t.weekday}`}>
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <span key={i}>{d}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {cells.map((cell, i) => {
                if (cell.muted) return <span key={i} className={`flex h-7 w-7 items-center justify-center text-xs ${t.dayMuted}`}>{cell.day}</span>;
                const disabled = Boolean(minDate) && cell.date < minDate;
                const isSelected = isSameDay(cell.date, selected);
                const isToday = isSameDay(cell.date, today);
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={disabled}
                    onClick={() => selectDay(cell.date)}
                    className={`h-7 w-7 rounded-full text-xs font-semibold transition-colors ${
                      disabled ? t.dayDisabled : isSelected ? t.daySelected : isToday ? t.dayToday : t.dayDefault
                    }`}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>

            {onTimeChange && (
              <div className="pt-2 border-t border-admin-border/50">
                <p className="text-[10px] font-bold uppercase tracking-wider text-admin-muted mb-1">Quick Times</p>
                <div className="grid grid-cols-2 gap-1">
                  {[
                    { label: "10:00 AM", val: "10:00" },
                    { label: "12:00 PM", val: "12:00" },
                    { label: "03:00 PM", val: "15:00" },
                    { label: "06:00 PM", val: "18:00" },
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => applyPreset(p.val)}
                      className={`rounded-lg py-1 px-1.5 text-[10px] font-bold transition-all text-center ${
                        time === p.val
                          ? isAdmin
                            ? "bg-admin-primary text-white shadow-xs"
                            : "bg-rose text-white shadow-xs"
                          : isAdmin
                          ? "bg-admin-bg text-admin-text hover:bg-admin-border/50"
                          : "bg-blush-soft/40 text-cocoa hover:bg-blush"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: PROFESSIONAL CLOCK UI */}
          {onTimeChange && (
            <div className="flex flex-col justify-between space-y-2 border-t md:border-t-0 md:border-l pt-2 md:pt-0 md:pl-3.5 border-admin-border/60">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-admin-muted">Selected Time</span>
                  <div className="flex rounded-lg border border-admin-border/60 bg-admin-bg p-0.5">
                    <button
                      type="button"
                      onClick={() => setClockMode("hour")}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${
                        clockMode === "hour"
                          ? isAdmin
                            ? "bg-admin-primary text-white shadow-xs"
                            : "bg-rose text-white shadow-xs"
                          : "text-admin-muted hover:text-admin-text"
                      }`}
                    >
                      HOUR
                    </button>
                    <button
                      type="button"
                      onClick={() => setClockMode("minute")}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${
                        clockMode === "minute"
                          ? isAdmin
                            ? "bg-admin-primary text-white shadow-xs"
                            : "bg-rose text-white shadow-xs"
                          : "text-admin-muted hover:text-admin-text"
                      }`}
                    >
                      MINUTE
                    </button>
                  </div>
                </div>

                <div className="mt-0.5 flex items-baseline justify-center gap-1.5">
                  <span className={`text-xl font-extrabold tracking-tight ${isAdmin ? "text-admin-primary" : "text-rose-deep"}`}>
                    {hour12} : {minute}
                  </span>
                  <span className="text-xs font-bold text-admin-muted">{period}</span>
                </div>
              </div>

              {/* Circular Clock Face Dial */}
              <div className="relative mx-auto my-0.5 flex h-40 w-40 items-center justify-center rounded-full bg-admin-bg/80 border border-admin-border/60 shadow-inner">
                <div className="absolute h-2.5 w-2.5 rounded-full bg-admin-primary z-20 shadow-xs" />
                <div
                  className="absolute bottom-1/2 left-1/2 w-0.5 origin-bottom bg-admin-primary transition-all duration-200 z-10"
                  style={{
                    height: "58px",
                    transform: `translateX(-50%) rotate(${clockMode === "hour" ? hourHandAngle : minuteHandAngle}deg)`,
                  }}
                >
                  <div className="absolute -top-1 -left-1 h-2.5 w-2.5 rounded-full bg-admin-primary shadow-xs" />
                </div>

                {clockMode === "hour" &&
                  Array.from({ length: 12 }, (_, i) => i + 1).map((hNum) => {
                    const hStr = String(hNum).padStart(2, "0");
                    const rad = (hNum * 30 - 90) * (Math.PI / 180);
                    const radius = 58;
                    const x = Math.round(radius * Math.cos(rad));
                    const y = Math.round(radius * Math.sin(rad));
                    const isSelected = hour12 === hStr;

                    return (
                      <button
                        key={hNum}
                        type="button"
                        onClick={() => handleSelectHour(hStr)}
                        style={{
                          left: `calc(50% + ${x}px - 12px)`,
                          top: `calc(50% + ${y}px - 12px)`,
                        }}
                        className={`absolute flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all duration-150 ${
                          isSelected
                            ? "bg-admin-primary text-white shadow-md scale-110 z-20"
                            : "text-admin-text hover:bg-admin-primary/20 font-semibold"
                        }`}
                      >
                        {hNum}
                      </button>
                    );
                  })}

                {clockMode === "minute" &&
                  [
                    { mStr: "00", angle: 0 },
                    { mStr: "15", angle: 90 },
                    { mStr: "30", angle: 180 },
                    { mStr: "45", angle: 270 },
                  ].map((item) => {
                    const rad = (item.angle - 90) * (Math.PI / 180);
                    const radius = 58;
                    const x = Math.round(radius * Math.cos(rad));
                    const y = Math.round(radius * Math.sin(rad));
                    const isSelected = minute === item.mStr;

                    return (
                      <button
                        key={item.mStr}
                        type="button"
                        onClick={() => handleSelectMinute(item.mStr)}
                        style={{
                          left: `calc(50% + ${x}px - 16px)`,
                          top: `calc(50% + ${y}px - 12px)`,
                        }}
                        className={`absolute flex h-6 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-150 ${
                          isSelected
                            ? "bg-admin-primary text-white shadow-md scale-110 z-20"
                            : "text-admin-text hover:bg-admin-primary/20 font-semibold"
                        }`}
                      >
                        :{item.mStr}
                      </button>
                    );
                  })}
              </div>

              {/* AM/PM Control */}
              <div className="flex rounded-xl border border-admin-border/80 p-0.5 bg-admin-bg overflow-hidden">
                {["AM", "PM"].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => updateTimeParts(hour12, minute, p)}
                    className={`flex-1 py-1 text-xs font-bold rounded-lg transition-all ${
                      period === p
                        ? isAdmin
                          ? "bg-admin-primary text-white shadow-xs"
                          : "bg-rose text-white shadow-xs"
                        : "text-admin-muted hover:text-admin-text"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Confirm Action */}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={`w-full rounded-xl py-2 text-xs font-bold tracking-wide transition-all shadow-xs ${t.daySelected}`}
              >
                Confirm Date &amp; Time
              </button>
            </div>
          )}
        </div>
      </div>
    )
  );

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={handleToggle}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-sm transition-all duration-200 ${t.trigger} ${
          open ? (isAdmin ? "ring-2 ring-admin-primary/20 border-admin-primary" : "ring-2 ring-rose/20 border-rose") : ""
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <CalendarIcon className={`h-4 w-4 shrink-0 ${t.icon}`} />
          <span className={selected ? "font-semibold" : "opacity-60 text-admin-muted"}>
            {selected
              ? `${selected.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" })}${
                  onTimeChange && time ? `  •  ${formatDisplayTime(time)}` : ""
                }`
              : placeholder}
          </span>
        </div>
      </button>

      {/* Render popover into document body via React Portal */}
      {typeof document !== "undefined" && createPortal(popoverContent, document.body)}
    </div>
  );
}
