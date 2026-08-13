import { Children, useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function TextField({ label, required, error, description, containerClassName = '', ...props }) {
  return (
    <label className={`block text-xs ${containerClassName}`}>
      {label && (
        <span className="mb-1 block font-semibold text-admin-text">
          {label} {required && <span className="text-admin-primary">*</span>}
        </span>
      )}
      <input
        {...props}
        className={`w-full rounded-xl border bg-admin-card p-2.5 text-sm text-admin-text shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 ${
          error
            ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
            : 'border-admin-border focus:border-admin-primary focus:ring-admin-primary/20'
        }`}
      />
      {description && !error && <p className="mt-1 text-[11px] text-admin-muted font-normal leading-tight">{description}</p>}
      {error && <p className="mt-1 text-[11px] font-semibold text-rose-600">{error}</p>}
    </label>
  );
}

export function TextAreaField({ label, required, error, description, containerClassName = '', ...props }) {
  return (
    <label className={`block text-xs ${containerClassName}`}>
      {label && (
        <span className="mb-1 block font-semibold text-admin-text">
          {label} {required && <span className="text-admin-primary">*</span>}
        </span>
      )}
      <textarea
        {...props}
        rows={props.rows || 2}
        className={`w-full rounded-xl border bg-admin-card p-2.5 text-sm text-admin-text shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 ${
          error
            ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
            : 'border-admin-border focus:border-admin-primary focus:ring-admin-primary/20'
        }`}
      />
      {description && !error && <p className="mt-1 text-[11px] text-admin-muted font-normal leading-tight">{description}</p>}
      {error && <p className="mt-1 text-[11px] font-semibold text-rose-600">{error}</p>}
    </label>
  );
}

export function SelectField({ label, required, error, description, containerClassName = '', value, onChange, disabled, children }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const options = Children.toArray(children)
    .filter((child) => child.type === 'option')
    .map((child) => ({ value: child.props.value, label: child.props.children }));
  const selected = options.find((opt) => String(opt.value) === String(value));

  useEffect(() => {
    function handleClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function selectOption(optValue) {
    onChange({ target: { value: optValue } });
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={`relative text-xs ${containerClassName}`}>
      {label && (
        <span className="mb-1 block font-semibold text-admin-text">
          {label} {required && <span className="text-admin-primary">*</span>}
        </span>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border bg-admin-card p-2.5 text-left text-sm text-admin-text shadow-sm transition-all duration-200 disabled:opacity-60 ${
          error
            ? 'border-rose-500'
            : open
            ? 'border-admin-primary ring-2 ring-admin-primary/20'
            : 'border-admin-border hover:border-admin-primary/60'
        }`}
      >
        <span className="truncate font-medium">{selected ? selected.label : 'Select…'}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-admin-primary transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: 'top' }}
            className="absolute left-0 z-50 mt-1 max-h-56 w-full overflow-auto rounded-2xl border border-admin-border bg-admin-card p-1.5 shadow-xl shadow-cocoa/10"
          >
            {options.map((opt) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <button
                  key={opt.value ?? 'empty'}
                  type="button"
                  onClick={() => selectOption(opt.value)}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-1.5 text-left text-xs transition-colors hover:bg-admin-bg ${
                    isSelected ? 'bg-admin-primary/10 font-bold text-admin-primary' : 'text-admin-text font-medium'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-admin-primary" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
      {description && !error && <p className="mt-1 text-[11px] text-admin-muted font-normal leading-tight">{description}</p>}
      {error && <p className="mt-1 text-[11px] font-semibold text-rose-600">{error}</p>}
    </div>
  );
}

export function CheckboxField({ label, description, containerClassName = '', ...props }) {
  return (
    <div className={containerClassName}>
      <label className="flex items-center gap-2 text-xs font-semibold text-admin-text cursor-pointer">
        <input type="checkbox" {...props} className="h-4 w-4 rounded border-admin-border text-admin-primary focus:ring-admin-primary cursor-pointer" />
        <span>{label}</span>
      </label>
      {description && <p className="ml-6 mt-0.5 text-[11px] text-admin-muted font-normal leading-tight">{description}</p>}
    </div>
  );
}
