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

      <section className="max-w-6xl mx-auto px-5 md:px-8 py-14 md:py-20 space-y-16">
        {loading ? (
          <Skeleton className="h-72 md:h-96 rounded-[2rem]" />
        ) : active.length > 0 ? (
          active.map((offer, i) => (
            <ScrollReveal key={offer.id} delay={i * 100}>
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
// Never shows a bare "no festival offers" message. Instead: a warm brand
// statement, any admin-scheduled upcoming campaigns (only if configured),
// the best-selling catalogue, and a Custom Cake CTA — this page's own,
// distinct from the homepage's Custom Cake section.
function EvergreenFestivalFallback({ bestSellers, upcoming, whatsapp }) {
  const waLink = (message) => `https://wa.me/${whatsapp || "918780652597"}?text=${encodeURIComponent(message)}`;

  return (
    <div className="space-y-16">
      <ScrollReveal className="text-center max-w-xl mx-auto">
        <Sparkles className="w-9 h-9 text-rose/40 mx-auto mb-4" strokeWidth={1.5} aria-hidden="true" />
        <h2 className="font-display font-semibold text-2xl md:text-3xl text-cocoa mb-3">
          Sweet Moments, All Year Round
        </h2>
        <p className="text-cocoa-soft/70 leading-relaxed">
          No special festival collection is running right now, but there's always something worth celebrating.
        </p>
      </ScrollReveal>

      {upcoming.length > 0 && (
        <div>
          <p className="text-center font-script text-2xl text-rose-deep mb-6">Coming Soon</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {upcoming.map((offer, i) => (
              <ScrollReveal key={offer.id} delay={i * 80} distance={12}>
                <div className="relative rounded-2xl overflow-hidden border border-blush/50 bg-ivory card-hover">
                  <div className="h-32 img-zoom-container">
                    <SafeImage
                      src={offer.banner}
                      alt={offer.title}
                      containerClassName="w-full h-full"
                      className="w-full h-full object-cover img-zoom-target opacity-90"
                    />
                  </div>
                  <div className="p-4">
                    <span className="inline-block text-[11px] font-bold uppercase tracking-wide text-rose-deep bg-blush-soft px-2.5 py-1 rounded-full mb-2">
                      Coming Soon
                    </span>
                    <p className="font-script text-lg text-rose-deep leading-tight">{offer.festival}</p>
                    <p className="font-display font-semibold text-cocoa">{offer.title}</p>
                    <p className="text-xs text-cocoa-soft/60 mt-1">
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
          <p className="text-center font-script text-2xl text-rose-deep mb-1">Customer Favourites</p>
          <h3 className="text-center font-display font-semibold text-2xl text-cocoa mb-8">Our Most Loved Cakes</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {bestSellers.map((p, i) => (
              <ScrollReveal key={p.id} delay={i * 80}>
                <ProductCard product={p} whatsapp={whatsapp} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      )}

      <ScrollReveal className="relative rounded-[2rem] overflow-hidden bg-cocoa text-cream p-8 md:p-12 text-center">
        <p className="font-script text-2xl text-blush mb-2">Made Just for You</p>
        <h3 className="font-display font-semibold text-2xl md:text-3xl mb-3">
          Can't Find Exactly What You're Looking For?
        </h3>
        <p className="text-cream/70 max-w-md mx-auto mb-6 leading-relaxed">
          Tell us what you're imagining and we'll help create something special.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <AnimatedButton to="/custom-cake" arrow>
            Create Your Custom Cake
          </AnimatedButton>
          <AnimatedButton
            href={waLink("Hi! I'd like to order a cake with Cakes by Tulsi.")}
            target="_blank"
            rel="noopener noreferrer"
            variant="secondary"
            className="!border-cream/40 !text-cream hover:!bg-cream/10"
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
    <div>
      <div className="relative rounded-[2rem] overflow-hidden group">
        <div className="img-zoom-container">
          <SafeImage
            src={offer.banner}
            alt={offer.title}
            blurLoad
            showSkeleton
            containerClassName="w-full h-64 md:h-80"
            className="w-full h-full object-cover img-zoom-target"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-cocoa/80 via-cocoa/20 to-transparent flex items-end">
          <div className="p-6 md:p-10 text-ivory">
            <p className="font-script text-3xl text-blush">{offer.festival}</p>
            <h2 className="font-display font-semibold text-2xl md:text-4xl">{offer.title}</h2>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <p className="text-cocoa-soft/80 max-w-xl leading-relaxed">{offer.description}</p>
        <div className="flex items-center gap-4 shrink-0">
          <span className="bg-gold text-cocoa font-bold px-4 py-1.5 rounded-full text-sm badge-float">{offer.discount}</span>
          {countdown && (
            <span className="text-sm font-semibold text-rose-deep bg-blush-soft px-3 py-1.5 rounded-full">
              {countdown.days}d {countdown.hours}h left
            </span>
          )}
        </div>
      </div>

      <div className="mt-6">
        <AnimatedButton
          href={waLink(`Hi! I'd like to order for ${offer.festival} (${offer.discount}).`)}
          target="_blank"
          rel="noopener noreferrer"
          arrow
        >
          {offer.ctaText}
        </AnimatedButton>
      </div>

      {relatedProducts.length > 0 && (
        <div className="grid sm:grid-cols-3 gap-4 mt-8">
          {relatedProducts.map((p, i) => (
            <ScrollReveal key={p.id} delay={i * 80} distance={12}>
              <div className="rounded-2xl overflow-hidden bg-ivory border border-blush/50 card-hover">
                <div className="img-zoom-container">
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
                <p className="p-3 font-display font-semibold text-sm text-cocoa">{p.name}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      )}
    </div>
  );
}
