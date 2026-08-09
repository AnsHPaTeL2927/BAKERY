// Tiny pub/sub so any component that changes a contact message's status
// (AdminMessages page, the navbar notifications dropdown, etc.) can nudge
// every other subscriber to refresh — keeps the unread badge in sync in
// real time without wiring up a websocket for one counter.

const listeners = new Set();

export function subscribeMessagesUpdate(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function emitMessagesUpdate() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      // a subscriber throwing shouldn't break the others
    }
  });
}
