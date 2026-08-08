import { useEffect, useState } from "react";
import { Cake } from "lucide-react";

// Self-contained fade: stays mounted while `visible` is true, then plays a
// 500ms opacity transition and unmounts itself once that finishes — callers
// just flip `visible` to false when whatever they're waiting on is ready.
export default function GlobalLoader({ visible }) {
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) setMounted(true);
  }, [visible]);

  if (!mounted) return null;

  return (
    <div
      onTransitionEnd={() => {
        if (!visible) setMounted(false);
      }}
      className={`fixed inset-0 z-9999 flex flex-col items-center justify-center bg-cream transition-opacity duration-500 ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div className="relative flex h-24 w-24 items-center justify-center">
        <span className="absolute inset-0 animate-spin rounded-full border-4 border-blush border-t-rose" />
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-blush-soft">
          <Cake className="h-7 w-7 text-rose-deep" />
        </span>
      </div>
      <p className="font-script mt-5 text-3xl text-rose-deep">Cakes by Tulsi</p>
      <p className="mt-1 text-sm text-cocoa-soft/80">Preparing something sweet…</p>
    </div>
  );
}
