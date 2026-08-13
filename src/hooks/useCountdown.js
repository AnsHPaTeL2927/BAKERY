import { useEffect, useState } from "react";

// Shared "days/hours remaining" countdown for anything with an `endDate`
// (offer banners, festival blocks). Returns null once the deadline has
// passed, so callers can naturally stop rendering the badge.
export default function useCountdown(endDate) {
  const [remaining, setRemaining] = useState(() => getRemaining(endDate));

  useEffect(() => {
    setRemaining(getRemaining(endDate));
    const id = setInterval(() => setRemaining(getRemaining(endDate)), 60000);
    return () => clearInterval(id);
  }, [endDate]);

  return remaining;
}

function getRemaining(endDate) {
  if (!endDate) return null;
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  return { days, hours };
}
