import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { getPublicContent, trackEvent } from "../services/api";
import SafeImage from "./SafeImage";

export default function ProductCard({ product }) {
  const [settings, setSettings] = useState({});
  const [weight, setWeight] = useState(product.weights?.[0] || "");
  const price = product.priceByWeight?.[weight] || product.price || 0;

  useEffect(() => {
    getPublicContent().then((data) => setSettings(data.settings || {})).catch(() => {});
  }, []);

  useEffect(() => {
    trackEvent("PRODUCT_VIEW", product.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const orderMessage = `Hi! I'd like to order:\n${product.name} (${weight}) - ₹${price}`;
  const waLink = (message) => `https://wa.me/${settings.whatsapp || '918780652597'}?text=${encodeURIComponent(message)}`;

  return (
    <div className="group bg-ivory rounded-3xl overflow-hidden border border-blush/50 card-hover flex flex-col relative">
      {/* Featured badge */}
      {product.featured && (
        <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-gold/90 backdrop-blur-sm text-ivory text-xs font-bold px-3 py-1.5 rounded-full shadow-md animate-fade-in-scale">
          <Sparkles className="w-3 h-3" />
          Best Seller
        </div>
      )}

      {/* Image */}
      <div className="aspect-[4/3] img-zoom-container relative">
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
      <div className="p-5 flex flex-col gap-2 flex-1">
        <h3 className="font-display font-semibold text-lg text-cocoa leading-snug">{product.name}</h3>
        <p className="text-sm text-cocoa-soft/75 line-clamp-2 leading-relaxed">{product.description}</p>

        {/* Weight selector */}
        {product.weights.length > 1 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {product.weights.map((w) => (
              <button
                key={w}
                onClick={() => setWeight(w)}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all duration-300 ${
                  w === weight
                    ? "bg-rose text-ivory border-rose shadow-sm shadow-rose/20"
                    : "border-blush text-cocoa-soft hover:border-rose/60 hover:text-rose-deep"
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        )}

        {/* Price & availability */}
        <div className="mt-auto pt-3 flex items-center justify-between">
          <span className="font-display font-bold text-xl text-rose-deep">₹{price}</span>
          {!product.available && (
            <span className="text-xs font-semibold text-cocoa-soft/50 bg-cream-deep px-3 py-1 rounded-full">Unavailable</span>
          )}
        </div>

        {/* CTA */}
        <a
          href={waLink(orderMessage)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent("ORDER_CLICK", product.id)}
          aria-disabled={!product.available}
          className={`mt-2 text-center rounded-full py-2.5 font-semibold text-sm transition-all duration-300 ${
            product.available
              ? "bg-rose text-ivory hover:bg-rose-deep hover:shadow-md hover:shadow-rose/20 hover:-translate-y-0.5 active:translate-y-0"
              : "bg-blush/50 text-cocoa-soft/50 pointer-events-none"
          }`}
        >
          Order on WhatsApp
        </a>
      </div>
    </div>
  );
}
