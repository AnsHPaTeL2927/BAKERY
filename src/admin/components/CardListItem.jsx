import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical } from 'lucide-react';
import { usePortalDropdown } from '../../hooks/usePortalDropdown';

const ACTION_WIDTH = 64; // px per revealed swipe action — also the ⋮-menu row height's rough visual weight
const OPEN_THRESHOLD_RATIO = 0.4;

// The mobile card-list row used by every catalog module (Products, Categories,
// Gallery, Offers, Testimonials) and Messages in place of a <tr>. Ships BOTH
// a visible overflow (⋮) menu and swipe-to-reveal for the same `actions` —
// swipe alone is a poor discoverability pattern for admin users who may never
// think to try it, so the ⋮ menu is the reliable path and swipe is a shortcut
// for people who already know it, not the only way in.
//
// Props:
//   image / icon      — leading visual (image URL takes precedence over icon)
//   title / subtitle   — primary two-line text block
//   meta               — optional right-aligned or third-line content (e.g. amount, date)
//   badge              — status badge node, rendered under the title block
//   primaryActions     — [{ icon, label, onClick }] rendered as visible tap targets on the card
//   actions            — [{ icon, label, onClick, danger }] available via ⋮ menu AND swipe-to-reveal
//   onClick            — optional, taps on the card body itself (e.g. open View)
//   theme              — 'admin' (default) | 'public'. Mirrors DataTable's existing theme prop:
//                         Orders/Messages use the admin-* token set, but the catalog pages
//                         (Categories/Products/Gallery/Offers/Testimonials) are themed with the
//                         public rose/blush/cocoa tokens — this card is themed to match whichever
//                         page renders it instead of forcing one palette onto both.
export default function CardListItem({
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
  const [translateX, setTranslateX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [open, setOpen] = useState(false);
  const dragState = useRef({ startX: 0, base: 0, moved: 0 });

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
        activeBg: 'active:bg-admin-bg/60',
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
        activeBg: 'active:bg-blush-soft/40',
        title: 'text-cocoa',
        subtitle: 'text-cocoa-soft',
        meta: 'text-cocoa',
        actionBtn: 'border-blush text-cocoa active:bg-blush-soft',
        menuBtn: 'text-cocoa-soft active:bg-blush-soft',
        menuPanel: 'border-blush bg-white shadow-cocoa/10',
        menuItem: 'text-cocoa hover:bg-blush-soft',
      };

  function handlePointerDown(e) {
    if (actions.length === 0) return;
    dragState.current = { startX: e.clientX, base: translateX, moved: 0 };
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }

  function handlePointerMove(e) {
    if (!dragging) return;
    const delta = e.clientX - dragState.current.startX;
    dragState.current.moved = Math.max(dragState.current.moved, Math.abs(delta));
    const next = Math.min(0, Math.max(-maxReveal, dragState.current.base + delta));
    setTranslateX(next);
  }

  function handlePointerUp() {
    if (!dragging) return;
    setDragging(false);
    const shouldOpen = translateX < -maxReveal * OPEN_THRESHOLD_RATIO;
    setOpen(shouldOpen);
    setTranslateX(shouldOpen ? -maxReveal : 0);
  }

  function handleCardTap() {
    if (dragState.current.moved > 10) return; // was a swipe, not a tap
    if (open) {
      setOpen(false);
      setTranslateX(0);
      return;
    }
    onClick?.();
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl border shadow-sm ${c.container}`}>
      {actions.length > 0 && (
        <div className="absolute inset-y-0 right-0 flex" style={{ width: maxReveal }} aria-hidden={!open}>
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => {
                setOpen(false);
                setTranslateX(0);
                action.onClick();
              }}
              style={{ width: ACTION_WIDTH }}
              className={`flex h-full flex-col items-center justify-center gap-1 text-xs font-semibold ${
                action.danger ? 'bg-red-50 text-red-600' : c.actionBg
              }`}
            >
              <action.icon className="h-4.5 w-4.5" />
              {action.label}
            </button>
          ))}
        </div>
      )}

      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleCardTap}
        style={{ transform: `translateX(${translateX}px)`, transition: dragging ? 'none' : 'transform 0.25s cubic-bezier(0.16,1,0.3,1)' }}
        className={`relative flex touch-pan-y items-center gap-3 p-3.5 ${c.rowBg} ${c.activeBg}`}
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
            onClick={(e) => {
              e.stopPropagation();
              action.onClick();
            }}
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
              menu.toggle();
            }}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${c.menuBtn}`}
          >
            <MoreVertical className="h-4.5 w-4.5" />
          </button>
        )}
      </div>

      {menu.open &&
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
                    onClick={() => {
                      menu.close();
                      action.onClick();
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
        )}
    </div>
  );
}
