import { useState } from "react";
import imageFallback from "../assets/image-fallback.svg";
import Skeleton from "./loading/Skeleton";

// Uploaded images can be missing, mid-migration, or unreachable (e.g. a stale
// Cloudflare Tunnel host baked into an old response) — this swaps to an
// on-brand placeholder instead of the browser's broken-image icon, exactly
// once per src change, so a broken fallback can't loop.
//
// Pass showSkeleton to also cover the moment between mount and the image
// actually loading, instead of a blank box — the wrapper only appears when
// opted in, so every existing call site is unaffected.
export default function SafeImage({
  src,
  alt = "",
  fallback = imageFallback,
  className,
  showSkeleton = false,
  containerClassName,
  ...rest
}) {
  const [failed, setFailed] = useState(false);
  const [lastSrc, setLastSrc] = useState(src);
  const [loaded, setLoaded] = useState(false);

  if (src !== lastSrc) {
    setLastSrc(src);
    setFailed(false);
    setLoaded(false);
  }

  const img = (
    <img
      src={!src || failed ? fallback : src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
      onLoad={() => setLoaded(true)}
      {...rest}
    />
  );

  if (!showSkeleton) return img;

  return (
    <div className={`relative ${containerClassName || ""}`}>
      {!loaded && <Skeleton className="absolute inset-0 h-full w-full rounded-none" />}
      {img}
    </div>
  );
}
