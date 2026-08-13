import { useEffect } from 'react';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { swipeManager } from '../utils/swipeManager';

// variant="form" (default): full-screen sheet below sm:, centered dialog at
// sm: and up — used for New/Edit Order, New/Edit Product, etc.
// variant="confirm": compact bottom sheet below sm:, small centered dialog
// at sm: and up — used by ConfirmDialog, where a full-screen takeover would
// be overkill for a yes/no decision.
export default function Modal({ open, title, subtitle, onClose, children, footer, wide, variant = 'form' }) {
  const isConfirm = variant === 'confirm';

  useEffect(() => {
    if (open) {
      swipeManager.close();
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className={`fixed inset-0 z-50 flex justify-center bg-cocoa/40 backdrop-blur-xs ${
            isConfirm ? 'items-end sm:items-center sm:p-6' : 'items-stretch sm:items-center sm:p-6'
          }`}
        >
          <motion.div
            initial={isConfirm ? { y: '100%' } : { y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={isConfirm ? { y: '100%' } : { y: 16, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            className={`flex w-full flex-col bg-white shadow-2xl shadow-cocoa/20 ${
              isConfirm
                ? 'max-h-[85vh] rounded-t-3xl border-t border-blush/70 sm:max-w-md sm:rounded-3xl sm:border'
                : `h-full rounded-none border-0 sm:h-auto sm:max-h-[90vh] sm:rounded-3xl sm:border sm:border-blush/70 ${wide ? 'sm:max-w-4xl' : 'sm:max-w-xl'}`
            }`}
          >
            {/* Sticky Modal Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-blush/50 px-6 py-4">
              <div>
                <h2 className="font-display text-xl font-bold text-cocoa">{title}</h2>
                {subtitle && <p className="text-xs text-cocoa-soft mt-0.5">{subtitle}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-cocoa-soft hover:bg-blush-soft transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {children}
            </div>

            {/* Sticky Modal Footer */}
            {footer && (
              <div className="shrink-0 border-t border-blush/50 bg-white/95 px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:rounded-b-3xl sm:pb-4">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
