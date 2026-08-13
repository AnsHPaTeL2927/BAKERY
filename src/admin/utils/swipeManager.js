import { useEffect, useState } from 'react';

let currentOpenId = null;
const listeners = new Set();

export const swipeManager = {
  getOpenId() {
    return currentOpenId;
  },
  open(id) {
    if (!id) return;
    if (currentOpenId !== id) {
      currentOpenId = id;
      listeners.forEach((fn) => fn(currentOpenId));
    }
  },
  close(id) {
    if (id === undefined || currentOpenId === id) {
      if (currentOpenId !== null) {
        currentOpenId = null;
        listeners.forEach((fn) => fn(currentOpenId));
      }
    }
  },
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function useSwipeItem(itemId) {
  const [isOpen, setIsOpen] = useState(swipeManager.getOpenId() === itemId);

  useEffect(() => {
    setIsOpen(swipeManager.getOpenId() === itemId);
    return swipeManager.subscribe((openId) => {
      setIsOpen(openId === itemId);
    });
  }, [itemId]);

  const openSwipe = () => swipeManager.open(itemId);
  const closeSwipe = () => swipeManager.close(itemId);

  return { isOpen, openSwipe, closeSwipe };
}

// Global scroll and outside pointerdown listeners
if (typeof window !== 'undefined') {
  const handleScroll = () => {
    if (swipeManager.getOpenId() !== null) {
      swipeManager.close();
    }
  };

  const handlePointerDownOutside = (e) => {
    const activeId = swipeManager.getOpenId();
    if (!activeId) return;

    // Do not close if clicking inside the active swiped card element
    const safeId = String(activeId).replace(/"/g, '\\"');
    const activeEl = document.querySelector(`[data-swipe-id="${safeId}"]`);
    if (activeEl && activeEl.contains(e.target)) {
      return;
    }

    // Do not close if clicking inside a modal or dialog
    if (e.target.closest && (e.target.closest('[role="dialog"]') || e.target.closest('.fixed'))) {
      swipeManager.close();
      return;
    }

    swipeManager.close();
  };

  window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
  window.addEventListener('pointerdown', handlePointerDownOutside, { capture: true });
}
