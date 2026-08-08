import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

// Slide-in-from-the-right panel for read-only detail views (e.g. Order
// Details), using the same overlay + motion pattern as AdminLayout's mobile
// nav drawer, instead of a second full-screen Modal design.
export default function Drawer({ open, title, onClose, children, widthClass = 'w-full max-w-lg' }) {
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
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
