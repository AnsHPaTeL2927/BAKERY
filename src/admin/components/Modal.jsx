import { X } from 'lucide-react';

export default function Modal({ open, title, onClose, children, wide }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-cocoa/40 px-4 py-10">
      <div className={`w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} rounded-3xl border border-blush/70 bg-white p-6 shadow-xl`}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-cocoa">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-cocoa-soft hover:bg-blush-soft"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
