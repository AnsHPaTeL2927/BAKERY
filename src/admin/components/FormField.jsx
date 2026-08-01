import { Children, useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export function TextField({ label, required, containerClassName = '', ...props }) {
  return (
    <label className={`block text-sm ${containerClassName}`}>
      <span className="mb-1.5 block font-semibold text-cocoa">
        {label} {required && <span className="text-rose-deep">*</span>}
      </span>
      <input {...props} required={required} className="w-full rounded-2xl border border-blush p-3" />
    </label>
  );
}

export function TextAreaField({ label, required, containerClassName = '', ...props }) {
  return (
    <label className={`block text-sm ${containerClassName}`}>
      <span className="mb-1.5 block font-semibold text-cocoa">
        {label} {required && <span className="text-rose-deep">*</span>}
      </span>
      <textarea {...props} required={required} rows={props.rows || 4} className="w-full rounded-2xl border border-blush p-3" />
    </label>
  );
}

export function SelectField({ label, required, containerClassName = '', value, onChange, disabled, children }) {
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
    <div ref={rootRef} className={`relative text-sm ${containerClassName}`}>
      <span className="mb-1.5 block font-semibold text-cocoa">
        {label} {required && <span className="text-rose-deep">*</span>}
      </span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-2xl border border-blush bg-white p-3 text-left text-cocoa transition-colors hover:border-rose disabled:opacity-60"
      >
        <span className="truncate">{selected ? selected.label : 'Select…'}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-cocoa-soft transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul className="absolute z-20 mt-2 max-h-60 w-full overflow-auto rounded-2xl border border-blush bg-white p-1.5 shadow-lg">
          {options.map((opt) => (
            <li key={opt.value ?? 'empty'}>
              <button
                type="button"
                onClick={() => selectOption(opt.value)}
                className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left transition-colors hover:bg-blush-soft ${
                  String(opt.value) === String(value) ? 'bg-blush-soft font-semibold text-rose-deep' : 'text-cocoa'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {String(opt.value) === String(value) && <Check className="h-4 w-4 shrink-0" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CheckboxField({ label, containerClassName = '', ...props }) {
  return (
    <label className={`flex items-center gap-2 text-sm text-cocoa-soft ${containerClassName}`}>
      <input type="checkbox" {...props} />
      {label}
    </label>
  );
}
