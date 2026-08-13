import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { getPublicContent } from "../services/api";
import SafeImage from "../components/SafeImage";
import ScrollReveal from "../components/ScrollReveal";
import AnimatedButton from "../components/AnimatedButton";
import ProductCard from "../components/ProductCard";
import Skeleton from "../components/loading/Skeleton";
import useCountdown from "../hooks/useCountdown";

export default function FestivalSpecials() {
  const [content, setContent] = useState({ offers: [], products: [], settings: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicContent()
      .then(setContent)
      .finally(() => setLoading(false));
  }, []);

  const festivalOffers = content.offers || [];
  const products = content.products || [];
  const settings = content.settings || {};

  // Date-aware: an offer past its own endDate never shows here, even if an
  // admin forgot to flip its "active" toggle off (server computes this).
  const active = festivalOffers
    .filter((o) => o.isCurrentlyActive ?? o.active)
    .sort((a, b) => a.priority - b.priority);

  // Admin-configured campaigns whose start date hasn't arrived yet — shown
  // as "Coming Soon" teasers. Never invented; only rendered if configured.
  const upcoming = festivalOffers
    .filter((o) => o.isUpcoming)
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    .slice(0, 3);

  const bestSellers = products.filter((p) => p.featured).slice(0, 6);
  const bestSellersDisplay = bestSellers.length > 0 ? bestSellers : products.slice(0, 6);

  return (
    <>
      <PageHeader
        eyebrow="Limited Time"
        title="Festival Specials"
        description="Seasonal collections and offers, available for a limited time only."
      />

      <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-14 md:py-20 space-y-10 sm:space-y-16">
        {loading ? (
          <Skeleton className="h-64 md:h-96 rounded-2xl sm:rounded-[2rem]" />
        ) : active.length > 0 ? (
          active.map((offer, i) => (
            <ScrollReveal key={offer.id} delay={i * 80}>
              <FestivalBlock offer={offer} products={products} whatsapp={settings.whatsapp} />
            </ScrollReveal>
          ))
        ) : (
          <EvergreenFestivalFallback
            bestSellers={bestSellersDisplay}
            upcoming={upcoming}
            whatsapp={settings.whatsapp}
          />
        )}
      </section>
    </>
  );
}

/* ═══ NO ACTIVE CAMPAIGN — EVERGREEN DISCOVERY ═══ */
function EvergreenFestivalFallback({ bestSellers, upcoming, whatsapp }) {
  const waLink = (message) => `https://wa.me/${whatsapp || "918780652597"}?text=${encodeURIComponent(message)}`;

  return (
    <div className="space-y-10 sm:space-y-16">
      <ScrollReveal className="text-center max-w-xl mx-auto">
        <Sparkles className="w-8 h-8 sm:w-9 sm:h-9 text-rose/40 mx-auto mb-3" strokeWidth={1.5} aria-hidden="true" />
        <h2 className="font-display font-semibold text-xl sm:text-2xl md:text-3xl text-cocoa mb-2 sm:mb-3">
          Sweet Moments, All Year Round
        </h2>
        <p className="text-xs sm:text-sm text-cocoa-soft/70 leading-relaxed">
          No special festival collection is running right now, but there's always something worth celebrating.
        </p>
      </ScrollReveal>

      {upcoming.length > 0 && (
        <div>
          <p className="text-center font-script text-xl sm:text-2xl text-rose-deep mb-4 sm:mb-6">Coming Soon</p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-5">
            {upcoming.map((offer, i) => (
              <ScrollReveal key={offer.id} delay={i * 60} distance={12}>
                <div className="relative rounded-xl sm:rounded-2xl overflow-hidden border border-blush/50 bg-ivory card-hover h-full flex flex-col">
                  <div className="h-24 sm:h-32 img-zoom-container bg-cream-deep/30">
                    <SafeImage
                      src={offer.banner}
                      alt={offer.title}
                      containerClassName="w-full h-full"
                      className="w-full h-full object-cover img-zoom-target opacity-90"
                    />
                  </div>
                  <div className="p-2.5 sm:p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wide text-rose-deep bg-blush-soft px-2 py-0.5 rounded-full mb-1.5">
                        Coming Soon
                      </span>
                      <p className="font-script text-sm sm:text-lg text-rose-deep leading-tight truncate">{offer.festival}</p>
                      <p className="font-display font-semibold text-cocoa text-xs sm:text-sm line-clamp-1">{offer.title}</p>
                    </div>
                    <p className="text-[10px] sm:text-xs text-cocoa-soft/60 mt-1.5">
                      Starts {new Date(offer.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      )}

      {bestSellers.length > 0 && (
        <div>
          <p className="text-center font-script text-xl sm:text-2xl text-rose-deep mb-1">Customer Favourites</p>
          <h3 className="text-center font-display font-semibold text-xl sm:text-2xl text-cocoa mb-6 sm:mb-8">Our Most Loved Cakes</h3>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
            {bestSellers.map((p, i) => (
              <ScrollReveal key={p.id} delay={i * 60}>
                <ProductCard product={p} whatsapp={whatsapp} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      )}

      <ScrollReveal className="relative rounded-2xl sm:rounded-[2rem] overflow-hidden bg-cocoa text-cream p-5 sm:p-8 md:p-12 text-center">
        <p className="font-script text-xl sm:text-2xl text-blush mb-1 sm:mb-2">Made Just for You</p>
        <h3 className="font-display font-semibold text-xl sm:text-2xl md:text-3xl mb-2 sm:mb-3">
          Can't Find Exactly What You're Looking For?
        </h3>
        <p className="text-cream/70 text-xs sm:text-sm max-w-md mx-auto mb-5 sm:mb-6 leading-relaxed">
          Tell us what you're imagining and we'll help create something special.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-xs sm:max-w-none mx-auto">
          <AnimatedButton to="/custom-cake" className="w-full sm:w-auto justify-center" arrow>
            Create Your Custom Cake
          </AnimatedButton>
          <AnimatedButton
            href={waLink("Hi! I'd like to order a cake with Cakes by Tulsi.")}
            target="_blank"
            rel="noopener noreferrer"
            variant="secondary"
            className="!border-cream/40 !text-cream hover:!bg-cream/10 w-full sm:w-auto justify-center"
            arrow
          >
            Order on WhatsApp
          </AnimatedButton>
        </div>
      </ScrollReveal>
    </div>
  );
}

/* ═══ ACTIVE FESTIVAL BLOCK ═══ */
function FestivalBlock({ offer, products, whatsapp }) {
  const countdown = useCountdown(offer.endDate);
  const relatedProducts = products.filter((p) => p.featured).slice(0, 3);
  const waLink = (message) => `https://wa.me/${whatsapp || '918780652597'}?text=${encodeURIComponent(message)}`;

  return (
    <div className="bg-ivory rounded-2xl sm:rounded-3xl border border-blush/50 p-4 sm:p-6 md:p-8 shadow-2xs">
      <div className="relative rounded-xl sm:rounded-2xl overflow-hidden group">
        <div className="img-zoom-container">
          <SafeImage
            src={offer.banner}
            alt={offer.title}
            blurLoad
            showSkeleton
            containerClassName="w-full h-48 sm:h-64 md:h-80"
            className="w-full h-full object-cover img-zoom-target"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-cocoa/85 via-cocoa/30 to-transparent flex items-end">
          <div className="p-4 sm:p-6 md:p-10 text-ivory">
            <p className="font-script text-2xl sm:text-3xl text-blush">{offer.festival}</p>
            <h2 className="font-display font-semibold text-xl sm:text-2xl md:text-4xl leading-tight">{offer.title}</h2>
          </div>
        </div>
      </div>

      <div className="mt-4 sm:mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
        <p className="text-cocoa-soft/80 text-xs sm:text-sm md:text-base max-w-xl leading-relaxed">{offer.description}</p>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {offer.discount && (
            <span className="bg-gold text-cocoa font-bold px-3 py-1 rounded-full text-xs sm:text-sm shadow-2xs">
              {offer.discount}
            </span>
          )}
          {countdown && (
            <span className="text-xs sm:text-sm font-semibold text-rose-deep bg-blush-soft px-3 py-1 rounded-full">
              {countdown.days}d {countdown.hours}h left
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 sm:mt-6">
        <AnimatedButton
          href={waLink(`Hi! I'd like to order for ${offer.festival} (${offer.discount}).`)}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto justify-center"
          arrow
        >
          {offer.ctaText || "Order Special Now"}
        </AnimatedButton>
      </div>

      {relatedProducts.length > 0 && (
        <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-blush/40">
          <p className="text-xs font-semibold uppercase tracking-wider text-cocoa-soft/60 mb-3">Featured Highlights</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
            {relatedProducts.map((p, i) => (
              <ScrollReveal key={p.id} delay={i * 60} distance={12}>
                <div className="rounded-xl sm:rounded-2xl overflow-hidden bg-ivory border border-blush/50 card-hover">
                  <div className="img-zoom-container bg-cream-deep/30">
                    <SafeImage
                      src={p.image}
                      alt={p.name}
                      blurLoad
                      showSkeleton
                      containerClassName="w-full aspect-[4/3]"
                      className="w-full h-full object-cover img-zoom-target"
                      loading="lazy"
                    />
                  </div>
                  <p className="p-2.5 sm:p-3 font-display font-semibold text-xs sm:text-sm text-cocoa truncate">{p.name}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
