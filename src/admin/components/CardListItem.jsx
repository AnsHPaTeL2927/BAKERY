import { useEffect, useRef, useState, useId } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical } from 'lucide-react';
import { usePortalDropdown } from '../../hooks/usePortalDropdown';
import { useSwipeItem, swipeManager } from '../utils/swipeManager';
import useIsMobile from '../hooks/useIsMobile';
import BottomSheet from './BottomSheet';

const ACTION_WIDTH = 64; // px per revealed swipe action
const OPEN_THRESHOLD_RATIO = 0.4;
const SWIPE_DRAG_THRESHOLD = 15; // px before horizontal swipe triggers open

// The mobile card-list row used by every catalog module (Products, Categories,
// Gallery, Offers, Testimonials) and Messages in place of a <tr>.
export default function CardListItem({
  id,
  itemId,
  image,
  icon: Icon,
  title,
  subtitle,
  meta,
  badge,
  primaryActions = [],
  actions = [],
  onClick,
  theme = 'admin',
}) {
  const autoId = useId();
  const cardId = id || itemId || title || autoId;
  const { isOpen, openSwipe, closeSwipe } = useSwipeItem(cardId);
  const isMobile = useIsMobile();

  const [translateX, setTranslateX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragState = useRef({ startX: 0, startY: 0, base: 0, moved: 0, directionLocked: null });

  const maxReveal = Math.min(actions.length * ACTION_WIDTH, 3 * ACTION_WIDTH);
  const menu = usePortalDropdown({ estimatedHeight: actions.length * 40 + 16, estimatedWidth: 176 });

  const isAdmin = theme === 'admin';
  const c = isAdmin
    ? {
        container: 'border-admin-border bg-admin-card',
        rowBg: 'bg-admin-card',
        actionBg: 'bg-admin-bg text-admin-text',
        thumbBg: 'bg-admin-bg',
        iconColor: 'text-admin-muted',
        title: 'text-admin-text',
        subtitle: 'text-admin-muted',
        meta: 'text-admin-text',
        actionBtn: 'border-admin-border text-admin-text active:bg-admin-bg',
        menuBtn: 'text-admin-muted active:bg-admin-bg',
        menuPanel: 'border-admin-border bg-admin-card shadow-cocoa/10',
        menuItem: 'text-admin-text hover:bg-admin-bg',
      }
    : {
        container: 'border-blush/70 bg-white',
        rowBg: 'bg-white',
        actionBg: 'bg-blush-soft text-cocoa',
        thumbBg: 'bg-blush-soft/40',
        iconColor: 'text-cocoa-soft',
        title: 'text-cocoa',
        subtitle: 'text-cocoa-soft',
        meta: 'text-cocoa',
        actionBtn: 'border-blush text-cocoa active:bg-blush-soft',
        menuBtn: 'text-cocoa-soft active:bg-blush-soft',
        menuPanel: 'border-blush bg-white shadow-cocoa/10',
        menuItem: 'text-cocoa hover:bg-blush-soft',
      };

  // Keep translateX in sync with isOpen whenever dragging ends or isOpen updates
  useEffect(() => {
    if (!dragging) {
      setTranslateX(isOpen ? -maxReveal : 0);
    }
  }, [isOpen, dragging, maxReveal]);

  function handlePointerDown(e) {
    if (actions.length === 0) return;
    if (e.target.closest('button')) return;

    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      base: translateX,
      moved: 0,
      directionLocked: null,
    };
    setDragging(true);
  }

  function handlePointerMove(e) {
    if (!dragging) return;
    const deltaX = e.clientX - dragState.current.startX;
    const deltaY = e.clientY - dragState.current.startY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    dragState.current.moved = Math.max(dragState.current.moved, absX);

    // Direction locking: handle native vertical scroll vs horizontal card swipe
    if (!dragState.current.directionLocked) {
      if (absX < 8 && absY < 8) return;
      if (absY > absX) {
        dragState.current.directionLocked = 'vertical';
        setDragging(false);
        return;
      }
      dragState.current.directionLocked = 'horizontal';
      openSwipe(); // Close any other open card immediately
      e.currentTarget.setPointerCapture?.(e.pointerId);
    }

    if (dragState.current.directionLocked === 'vertical') return;

    const next = Math.min(0, Math.max(-maxReveal, dragState.current.base + deltaX));
    setTranslateX(next);
  }

  function handlePointerUp(e) {
    if (!dragging) return;
    setDragging(false);

    if (dragState.current.directionLocked === 'horizontal') {
      const deltaX = e.clientX - dragState.current.startX;
      const shouldOpen = translateX < -maxReveal * OPEN_THRESHOLD_RATIO || deltaX < -SWIPE_DRAG_THRESHOLD;

      if (shouldOpen) {
        openSwipe();
        setTranslateX(-maxReveal);
      } else {
        closeSwipe();
        setTranslateX(0);
      }
    }
  }

  function handleCardClick(e) {
    if (dragState.current.moved > 10) return; // was a drag gesture
    if (isOpen) {
      closeSwipe();
      return;
    }
    onClick?.(e);
  }

  function handleActionClick(action, e) {
    e.stopPropagation();
    closeSwipe();
    action.onClick?.();
  }

  return (
    <div
      data-swipe-id={cardId}
      className={`relative overflow-hidden rounded-2xl border shadow-sm ${c.container}`}
    >
      {/* Background Actions Panel (z-0) */}
      {actions.length > 0 && (
        <div
          className="absolute inset-y-0 right-0 z-0 flex items-stretch"
          style={{ width: maxReveal }}
          aria-hidden={!isOpen}
        >
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={(e) => handleActionClick(action, e)}
              style={{ width: ACTION_WIDTH }}
              className={`flex h-full flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors ${
                action.danger ? 'bg-red-50 text-red-600 active:bg-red-100' : `${c.actionBg} active:opacity-80`
              }`}
            >
              <action.icon className="h-4.5 w-4.5" />
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Foreground Opaque Card Row (z-10) */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleCardClick}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: dragging ? 'none' : 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className={`relative z-10 flex w-full touch-pan-y items-center gap-3 p-3.5 ${c.rowBg}`}
      >
        {(image || Icon) && (
          <span className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl ${c.thumbBg}`}>
            {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : <Icon className={`h-5 w-5 ${c.iconColor}`} />}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <p className={`truncate font-semibold ${c.title}`}>{title}</p>
          {subtitle && <p className={`truncate text-xs ${c.subtitle}`}>{subtitle}</p>}
          {badge && <div className="mt-1.5">{badge}</div>}
        </div>

        {meta && <div className={`shrink-0 text-right text-sm ${c.meta}`}>{meta}</div>}

        {primaryActions.map((action) => (
          <button
            key={action.label}
            type="button"
            title={action.label}
            onClick={(e) => handleActionClick(action, e)}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${c.actionBtn}`}
          >
            <action.icon className="h-4.5 w-4.5" />
          </button>
        ))}

        {actions.length > 0 && (
          <button
            ref={menu.triggerRef}
            type="button"
            title="More actions"
            onClick={(e) => {
              e.stopPropagation();
              swipeManager.close();
              menu.toggle();
            }}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${c.menuBtn}`}
          >
            <MoreVertical className="h-4.5 w-4.5" />
          </button>
        )}
      </div>

      {isMobile ? (
        <BottomSheet open={menu.open} title="Actions" onClose={menu.close}>
          <div className="space-y-1">
            {actions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={(e) => {
                  menu.close();
                  handleActionClick(action, e);
                }}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold ${
                  action.danger ? 'text-red-600 hover:bg-red-50' : c.menuItem
                }`}
              >
                <action.icon className="h-4 w-4" />
                {action.label}
              </button>
            ))}
          </div>
        </BottomSheet>
      ) : (
        menu.open &&
        createPortal(
          <div ref={menu.dropdownRef} style={menu.portalStyle}>
            <AnimatePresence>
              <motion.div
                key="card-item-menu"
                initial={{ opacity: 0, y: menu.openUpward ? 6 : -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: menu.openUpward ? 6 : -6, scale: 0.96 }}
                transition={{ duration: 0.12 }}
                className={`rounded-2xl border p-1.5 shadow-xl ${c.menuPanel}`}
              >
                {actions.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={(e) => {
                      menu.close();
                      handleActionClick(action, e);
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-semibold ${
                      action.danger ? 'text-red-600 hover:bg-red-50' : c.menuItem
                    }`}
                  >
                    <action.icon className="h-4 w-4" />
                    {action.label}
                  </button>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>,
          document.body,
        )
      )}
    </div>
  );
}
