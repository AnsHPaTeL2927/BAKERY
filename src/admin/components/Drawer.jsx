import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import useIsMobile from '../hooks/useIsMobile';
import BottomSheet from './BottomSheet';
import { swipeManager } from '../utils/swipeManager';

// Slide-in-from-the-right panel for read-only detail views (e.g. Order
// Details), using the same overlay + motion pattern as AdminLayout's mobile
// nav drawer, instead of a second full-screen Modal design.
//
// Pass mobileBottomSheet to have this render via the existing BottomSheet
// component below 640px instead — a right-edge slide-in is an awkward reach
// on a phone; a sheet that rises from the thumb zone isn't. Desktop/tablet
// (and any caller that doesn't opt in) render exactly as before.
export default function Drawer({ open, title, onClose, children, widthClass = 'w-full max-w-lg', mobileBottomSheet = false, footer }) {
  const isMobile = useIsMobile();

  useEffect(() => {
    if (open) {
      swipeManager.close();
    }
  }, [open]);

  if (mobileBottomSheet && isMobile) {
    return (
      <BottomSheet open={open} title={title} onClose={onClose} footer={footer} maxHeightClass="max-h-[92vh]">
        {children}
      </BottomSheet>
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-cocoa/40"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className={`fixed inset-y-0 right-0 z-50 flex flex-col bg-admin-card shadow-2xl ${widthClass}`}
          >
            <div className="flex items-center justify-between border-b border-admin-border px-6 py-4">
              <h2 className="font-display text-lg font-semibold text-admin-text">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-admin-muted hover:bg-admin-bg"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer && <div className="shrink-0 border-t border-admin-border px-6 py-4">{footer}</div>}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
