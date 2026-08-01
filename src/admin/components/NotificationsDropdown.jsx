import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Mail } from 'lucide-react';
import { messagesApi } from '../services/adminApi';
import { formatRelativeTime } from '../utils/time';

export default function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState([]);
  const [total, setTotal] = useState(0);
  const rootRef = useRef(null);

  useEffect(() => {
    messagesApi
      .list({ status: 'NEW', page: 1, pageSize: 5 })
      .then((data) => {
        setUnread(data.items);
        setTotal(data.total);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-admin-border bg-admin-card text-admin-text transition-colors hover:bg-admin-bg"
        aria-label="Notifications"
      >
        <Bell className="h-4.5 w-4.5" />
        {total > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-admin-primary px-1 text-[10px] font-bold text-white">
            {total > 9 ? '9+' : total}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-30 mt-2 w-80 rounded-admin border border-admin-border bg-admin-card p-2 shadow-xl"
          >
            <div className="flex items-center justify-between px-3 py-2">
              <p className="text-sm font-semibold text-admin-text">Notifications</p>
              {total > 0 && <span className="text-xs text-admin-muted">{total} unread</span>}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {unread.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-admin-muted">You're all caught up.</p>
              )}
              {unread.map((msg) => (
                <div key={msg.id} className="flex gap-3 rounded-xl px-3 py-2.5 hover:bg-admin-bg">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-admin-primary/10 text-admin-primary">
                    <Mail className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-admin-text">{msg.name}</p>
                    <p className="truncate text-xs text-admin-muted">{msg.message}</p>
                    <p className="mt-0.5 text-[11px] text-admin-muted">{formatRelativeTime(msg.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              to="/admin/messages"
              onClick={() => setOpen(false)}
              className="mt-1 block rounded-xl px-3 py-2 text-center text-sm font-semibold text-admin-primary hover:bg-admin-bg"
            >
              View all messages
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
