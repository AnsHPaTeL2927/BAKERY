import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { swipeManager } from '../utils/swipeManager';

// The mobile counterpart to Modal — used for lighter, quicker interactions
// (change status, filters, action menus, pickers) where a full-screen or
// centered dialog would be overkill. Slides up from the bottom, respects the
// iPhone home-indicator safe area, and keeps a sticky footer slot for
// Reset/Apply or Confirm-style actions so it never scrolls out of reach.
//
// Portal-rendered to document.body so it always layers above sticky headers,
// navbars, and any ancestor with its own stacking context.
export default function BottomSheet({ open, title, onClose, children, footer, maxHeightClass = 'max-h-[80vh]' }) {
  useEffect(() => {
    if (open) {
      swipeManager.close();
    }
  }, [open]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-cocoa/40 backdrop-blur-xs"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            className={`fixed inset-x-0 bottom-0 z-50 flex ${maxHeightClass} flex-col rounded-t-3xl border-t border-admin-border bg-admin-card shadow-2xl shadow-cocoa/20`}
          >
            <div className="flex shrink-0 items-center justify-between px-5 pt-3">
              <span className="mx-auto block h-1.5 w-10 rounded-full bg-admin-border" aria-hidden="true" />
            </div>
            {title && (
              <div className="flex shrink-0 items-center justify-between px-5 pb-3 pt-2">
                <h2 className="font-display text-base font-semibold text-admin-text">{title}</h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-admin-muted hover:bg-admin-bg"
                  aria-label="Close"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto px-5 pb-3">{children}</div>
            {footer && (
              <div className="shrink-0 border-t border-admin-border bg-admin-card px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
