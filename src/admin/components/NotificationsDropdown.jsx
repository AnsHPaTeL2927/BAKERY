import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Mail, Check } from 'lucide-react';
import { messagesApi } from '../services/adminApi';
import { formatRelativeTime } from '../utils/time';
import { subscribeMessagesUpdate, emitMessagesUpdate } from '../utils/messagesBus';
import useIsMobile from '../hooks/useIsMobile';
import BottomSheet from './BottomSheet';

// Background poll so the badge also catches messages read from another tab
// or another admin's session — the bus event handles same-tab instant sync.
const POLL_INTERVAL_MS = 30000;

function NotificationList({ unread, markingId, onMarkAsRead, onNavigate }) {
  return (
    <>
      <div className="max-h-72 overflow-y-auto">
        {unread.length === 0 && <p className="px-3 py-6 text-center text-sm text-admin-muted">You're all caught up.</p>}
        {unread.map((msg) => (
          <div key={msg.id} className="group flex gap-3 rounded-xl px-2 py-2.5 hover:bg-admin-bg">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-admin-primary/10 text-admin-primary">
              <Mail className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-admin-text">{msg.name}</p>
              <p className="truncate text-xs text-admin-muted">{msg.message}</p>
              <p className="mt-0.5 text-[11px] text-admin-muted">{formatRelativeTime(msg.createdAt)}</p>
            </div>
            <button
              type="button"
              title="Mark as read"
              onClick={() => onMarkAsRead(msg)}
              disabled={markingId === msg.id}
              className="flex h-11 w-11 shrink-0 items-center justify-center self-center rounded-full text-admin-muted opacity-100 transition-opacity hover:bg-admin-border/60 hover:text-admin-primary disabled:opacity-60 sm:h-7 sm:w-7 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      <Link
        to="/admin/messages"
        onClick={onNavigate}
        className="mt-1 block rounded-xl px-3 py-2.5 text-center text-sm font-semibold text-admin-primary hover:bg-admin-bg"
      >
        View all messages
      </Link>
    </>
  );
}

export default function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState([]);
  const [total, setTotal] = useState(0);
  const [markingId, setMarkingId] = useState(null);
  const rootRef = useRef(null);
  const isMobile = useIsMobile();

  const refresh = useCallback(() => {
    messagesApi
      .list({ status: 'NEW', page: 1, pageSize: 5 })
      .then((data) => {
        setUnread(data.items);
        setTotal(data.total);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const unsubscribe = subscribeMessagesUpdate(refresh);
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [refresh]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function markAsRead(msg) {
    setMarkingId(msg.id);
    try {
      await messagesApi.updateStatus(msg.id, 'READ');
      setUnread((prev) => prev.filter((m) => m.id !== msg.id));
      setTotal((prev) => Math.max(0, prev - 1));
      emitMessagesUpdate();
    } catch {
      // leave state as-is — the next poll/event will reconcile it
    } finally {
      setMarkingId(null);
    }
  }

  const bellButton = (
    <button
      type="button"
      onClick={() => setOpen((o) => !o)}
      // Mobile: 14px-radius square-ish tile on admin-bg, matching the design's
      // header bell exactly. Desktop (sm:+): original circular card-bg button, unchanged.
      className="relative flex h-11 w-11 items-center justify-center rounded-[14px] border border-admin-border bg-admin-bg text-admin-text transition-colors hover:bg-admin-border/40 sm:rounded-full sm:bg-admin-card sm:hover:bg-admin-bg"
      aria-label="Notifications"
    >
      <Bell className="h-4.5 w-4.5" />
      {total > 0 && (
        <>
          {/* Mobile: plain accent dot (per design). Desktop: original numbered badge, unchanged. */}
          <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full border-2 border-admin-bg bg-admin-primary sm:hidden" />
          <span className="absolute -top-1 -right-1 hidden h-5 min-w-5 items-center justify-center rounded-full bg-admin-primary px-1 text-[10px] font-bold text-white sm:flex">
            {total > 9 ? '9+' : total}
          </span>
        </>
      )}
    </button>
  );

  if (isMobile) {
    return (
      <div ref={rootRef}>
        {bellButton}
        <BottomSheet open={open} title={total > 0 ? `Notifications · ${total} unread` : 'Notifications'} onClose={() => setOpen(false)}>
          <NotificationList unread={unread} markingId={markingId} onMarkAsRead={markAsRead} onNavigate={() => setOpen(false)} />
        </BottomSheet>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      {bellButton}

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
            <div className="px-1">
              <NotificationList unread={unread} markingId={markingId} onMarkAsRead={markAsRead} onNavigate={() => setOpen(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
