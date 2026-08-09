import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * usePortalDropdown
 * Calculates the best position (above/below, left/right) for a dropdown
 * based on the trigger element's viewport position and the estimated panel size.
 *
 * Returns:
 *   triggerRef  — attach to the trigger button
 *   dropdownRef — attach to the dropdown panel
 *   open        — boolean
 *   toggle      — opens or closes, recalculating position each time
 *   close       — force close
 *   portalStyle — { position, top, left, minWidth, maxHeight, transformOrigin }
 *   openUpward  — boolean (for animation direction)
 */
export function usePortalDropdown({ estimatedHeight = 240, estimatedWidth = 0 } = {}) {
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState({});
  const [openUpward, setOpenUpward] = useState(false);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  const calcPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const vpW = window.innerWidth;
    const vpH = window.innerHeight;

    const panelW = estimatedWidth || rect.width;
    const panelH = estimatedHeight;

    const spaceBelow = vpH - rect.bottom;
    const spaceAbove = rect.top;
    const goUp = spaceBelow < panelH + 16 && spaceAbove >= panelH + 16;

    let left = rect.left;
    if (left + panelW > vpW - 12) {
      left = Math.max(12, vpW - panelW - 12);
    }

    const top = goUp ? rect.top - panelH - 6 : rect.bottom + 6;

    setOpenUpward(goUp);
    setStyle({
      position: "fixed",
      top: `${Math.max(8, top)}px`,
      left: `${left}px`,
      minWidth: `${rect.width}px`,
      width: estimatedWidth ? `${estimatedWidth}px` : `${rect.width}px`,
      zIndex: 9999,
      transformOrigin: goUp ? "bottom" : "top",
    });
  }, [estimatedHeight, estimatedWidth]);

  function toggle() {
    if (!open) {
      calcPosition();
    }
    setOpen((o) => !o);
  }

  function close() {
    setOpen(false);
  }

  // Recalculate on scroll/resize while open
  useEffect(() => {
    if (!open) return;
    const handleScrollResize = () => calcPosition();
    window.addEventListener("scroll", handleScrollResize, true);
    window.addEventListener("resize", handleScrollResize);
    return () => {
      window.removeEventListener("scroll", handleScrollResize, true);
      window.removeEventListener("resize", handleScrollResize);
    };
  }, [open, calcPosition]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return { triggerRef, dropdownRef, open, toggle, close, portalStyle: style, openUpward };
}

/**
 * PortalDropdown
 * Wraps usePortalDropdown and renders children into document.body portal.
 * Usage:
 *   <PortalDropdown trigger={<button>…</button>} estimatedHeight={200}>
 *     <div>…dropdown content…</div>
 *   </PortalDropdown>
 */
export function PortalDropdown({ trigger, children, estimatedHeight = 240, estimatedWidth = 0, className = "" }) {
  const { triggerRef, dropdownRef, open, toggle, portalStyle, openUpward } = usePortalDropdown({ estimatedHeight, estimatedWidth });

  const cloned = typeof trigger === "function"
    ? trigger({ ref: triggerRef, onClick: toggle, open })
    : null;

  return (
    <>
      {cloned}
      {open && typeof document !== "undefined" && createPortal(
        <div ref={dropdownRef} style={portalStyle} className={className}>
          {typeof children === "function" ? children({ close: () => { /* passthrough */ }, openUpward }) : children}
        </div>,
        document.body
      )}
    </>
  );
}
