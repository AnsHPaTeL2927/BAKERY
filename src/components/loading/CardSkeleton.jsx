import Skeleton from "./Skeleton";

// Image + title + subtitle + button — the shape shared by product cards,
// category tiles, gallery tiles, offer banners, and testimonial cards.
export default function CardSkeleton({ className = "", imageClassName = "aspect-4/3" }) {
  return (
    <div className={`overflow-hidden rounded-3xl border border-blush/60 bg-ivory ${className}`}>
      <Skeleton className={`w-full rounded-none ${imageClassName}`} />
      <div className="space-y-2.5 p-5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="mt-3 h-9 w-full rounded-full" />
      </div>
    </div>
  );
}
