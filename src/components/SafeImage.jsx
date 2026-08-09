import { useState } from "react";
import imageFallback from "../assets/image-fallback.svg";
import Skeleton from "./loading/Skeleton";

// Uploaded images can be missing, mid-migration, or unreachable (e.g. a stale
// Cloudflare Tunnel host baked into an old response) — this swaps to an
// on-brand placeholder instead of the browser's broken-image icon, exactly
// once per src change, so a broken fallback can't loop.
//
// Enhanced with blur-to-sharp loading transition: images start blurred and
// smoothly become sharp when loaded, giving a premium feel.
export default function SafeImage({
  src,
  alt = "",
  fallback = imageFallback,
  className,
  showSkeleton = false,
  blurLoad = false,
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

  const imgStyle = blurLoad && !loaded
    ? { filter: "blur(12px)", transform: "scale(1.04)", transition: "filter 0.6s ease, transform 0.6s ease" }
    : blurLoad
      ? { filter: "blur(0)", transform: "scale(1)", transition: "filter 0.6s ease, transform 0.6s ease" }
      : undefined;

  const img = (
    <img
      src={!src || failed ? fallback : src}
      alt={alt}
      className={className}
      style={imgStyle}
      onError={() => setFailed(true)}
      onLoad={() => setLoaded(true)}
      {...rest}
    />
  );

  if (!showSkeleton && !blurLoad) return img;

  return (
    <div className={`relative overflow-hidden ${containerClassName || ""}`}>
      {showSkeleton && !loaded && <Skeleton className="absolute inset-0 h-full w-full rounded-none" />}
      {img}
    </div>
  );
}
