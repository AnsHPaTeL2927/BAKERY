import { useState, useEffect } from "react";
import { Sparkles, Star, MessageCircle } from "lucide-react";
import { getPublicContent, trackEvent } from "../services/api";
import SafeImage from "./SafeImage";
import { buildPublicWhatsAppLink } from "../utils/whatsapp";

// `whatsapp` should be passed down from the page that renders this card —
// every page already loads it via its own getPublicContent() call. The
// self-fetch below only exists as a safety net for any caller that doesn't
// pass it; every grid of cards independently re-fetching the full public
// content bundle just for one phone number is exactly the kind of request
// pile-up that trips the public API's rate limiter.
export default function ProductCard({ product, whatsapp, viewMode = "grid" }) {
  const [fetchedWhatsapp, setFetchedWhatsapp] = useState(null);
  const [weight, setWeight] = useState(product.weights?.[0] || "");
  const price = product.priceByWeight?.[weight] || product.price || 0;

  useEffect(() => {
    if (whatsapp) return;
    getPublicContent().then((data) => setFetchedWhatsapp(data.settings?.whatsapp || null)).catch(() => {});
  }, [whatsapp]);

  useEffect(() => {
    trackEvent("PRODUCT_VIEW", product.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const orderMessage = `Hi! I'd like to order:\n${product.name} (${weight}) - ₹${price}`;
  const waLink = (message) => buildPublicWhatsAppLink(whatsapp || fetchedWhatsapp, message);

  if (viewMode === "list") {
    return (
      <div className="group bg-ivory rounded-2xl sm:rounded-3xl overflow-hidden border border-blush/50 card-hover flex flex-row items-center p-3 sm:p-4 gap-3.5 sm:gap-5 relative">
        {/* Thumbnail Image */}
        <div className="relative shrink-0 w-28 h-28 sm:w-36 sm:h-36 rounded-xl sm:rounded-2xl overflow-hidden img-zoom-container bg-cream-deep/40">
          <SafeImage
            src={product.image}
            alt={product.name}
            loading="lazy"
            blurLoad
            showSkeleton
            containerClassName="w-full h-full"
            className="w-full h-full object-cover img-zoom-target"
          />
          {product.featured && (
            <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-gold/90 backdrop-blur-sm text-ivory text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-sm">
              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span>Best Seller</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 self-stretch">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display font-semibold text-sm sm:text-lg text-cocoa leading-snug truncate">
                {product.name}
              </h3>
              {(product.rating || product.reviewCount) && (
                <span className="shrink-0 flex items-center gap-0.5 text-gold text-xs font-bold bg-blush-soft/60 px-2 py-0.5 rounded-full">
                  <Star className="w-3 h-3 fill-gold" />
                  {Number(product.rating || 5).toFixed(1)}
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-cocoa-soft/75 line-clamp-1 sm:line-clamp-2 mt-1 leading-relaxed">
              {product.description}
            </p>

            {/* Weights */}
            {product.weights?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {product.weights.map((w) => (
                  <button
                    key={w}
                    type="button"
                    disabled={product.weights.length === 1}
                    onClick={() => setWeight(w)}
                    className={`text-[10px] sm:text-xs px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border font-semibold transition-all duration-200 disabled:cursor-default ${
                      w === weight
                        ? "bg-rose text-ivory border-rose shadow-2xs"
                        : "border-blush text-cocoa-soft hover:border-rose/60 hover:text-rose-deep"
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Bar: Price & Order button */}
          <div className="mt-2 pt-2 border-t border-blush/30 flex items-center justify-between gap-2">
            <span className="font-display font-bold text-base sm:text-xl text-rose-deep">₹{price}</span>
            <a
              href={waLink(orderMessage)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent("ORDER_CLICK", product.id)}
              aria-disabled={!product.available}
              className={`inline-flex items-center justify-center gap-1.5 rounded-full px-3.5 py-1.5 sm:px-5 sm:py-2 font-semibold text-xs sm:text-sm transition-all duration-300 ${
                product.available
                  ? "bg-rose text-ivory hover:bg-rose-deep hover:shadow-md active:scale-95"
                  : "bg-blush/50 text-cocoa-soft/50 pointer-events-none"
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{product.available ? "Order" : "Out of Stock"}</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group bg-ivory rounded-2xl sm:rounded-3xl overflow-hidden border border-blush/50 card-hover flex flex-col relative h-full">
      {/* Featured badge */}
      {product.featured && (
        <div className="absolute top-2.5 left-2.5 sm:top-4 sm:left-4 z-10 flex items-center gap-1 sm:gap-1.5 bg-gold/90 backdrop-blur-sm text-ivory text-[10px] sm:text-xs font-bold px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full shadow-md">
          <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          <span>Best Seller</span>
        </div>
      )}

      {/* Image */}
      <div className="aspect-[4/3] img-zoom-container relative bg-cream-deep/30">
        <SafeImage
          src={product.image}
          alt={product.name}
          loading="lazy"
          blurLoad
          showSkeleton
          containerClassName="w-full h-full"
          className="w-full h-full object-cover img-zoom-target"
        />
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-cocoa/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      {/* Content */}
      <div className="p-2.5 sm:p-5 flex flex-col gap-1 sm:gap-2 flex-1">
        <h3 className="font-display font-semibold text-xs sm:text-base md:text-lg text-cocoa leading-tight line-clamp-1 sm:line-clamp-2">
          {product.name}
        </h3>

        {/* Rating / order-count */}
        {(product.rating || product.reviewCount || product.orderCount) && (
          <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-cocoa-soft/70">
            {product.rating && (
              <span className="flex items-center gap-0.5 text-gold font-bold">
                <Star className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 fill-gold" />
                {Number(product.rating).toFixed(1)}
              </span>
            )}
            {(product.reviewCount || product.orderCount) && (
              <span className="truncate">
                {product.reviewCount ? `(${product.reviewCount})` : `${product.orderCount}+ ordered`}
              </span>
            )}
          </div>
        )}

        <p className="text-xs text-cocoa-soft/75 line-clamp-2 leading-relaxed hidden sm:block">
          {product.description}
        </p>

        {/* Weight selector */}
        {product.weights?.length > 0 && (
          <div className="flex flex-wrap gap-1 sm:gap-1.5 mt-0.5 sm:mt-1">
            {product.weights.map((w) => (
              <button
                key={w}
                type="button"
                disabled={product.weights.length === 1}
                onClick={() => setWeight(w)}
                className={`text-[9px] sm:text-xs px-1.5 py-0.5 sm:px-3 sm:py-1 rounded-full border font-semibold transition-all duration-200 disabled:cursor-default ${
                  w === weight
                    ? "bg-rose text-ivory border-rose shadow-2xs"
                    : "border-blush text-cocoa-soft hover:border-rose/60 hover:text-rose-deep"
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        )}

        {/* Price & availability */}
        <div className="mt-auto pt-1.5 sm:pt-3 flex items-center justify-between">
          <span className="font-display font-extrabold text-sm sm:text-xl text-rose-deep">₹{price}</span>
          {!product.available && (
            <span className="text-[9px] sm:text-xs font-semibold text-cocoa-soft/50 bg-cream-deep px-2 py-0.5 rounded-full">Out of Stock</span>
          )}
        </div>

        {/* CTA */}
        <a
          href={waLink(orderMessage)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent("ORDER_CLICK", product.id)}
          aria-disabled={!product.available}
          className={`mt-1 sm:mt-2 text-center rounded-full py-1.5 sm:py-2.5 px-2.5 sm:px-3 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1 sm:gap-1.5 transition-all duration-300 ${
            product.available
              ? "bg-rose text-ivory hover:bg-rose-deep hover:shadow-md hover:shadow-rose/20 active:scale-95"
              : "bg-blush/50 text-cocoa-soft/50 pointer-events-none"
          }`}
        >
          <MessageCircle className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{product.available ? "Order on WhatsApp" : "Unavailable"}</span>
        </a>
      </div>
    </div>
  );
}
