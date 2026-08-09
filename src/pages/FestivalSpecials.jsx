import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import { getPublicContent } from "../services/api";
import SafeImage from "../components/SafeImage";
import ScrollReveal from "../components/ScrollReveal";
import AnimatedButton from "../components/AnimatedButton";

function useCountdown(endDate) {
  const [remaining, setRemaining] = useState(getRemaining());

  function getRemaining() {
    const diff = new Date(endDate).getTime() - Date.now();
    if (diff <= 0) return null;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    return { days, hours };
  }

  useEffect(() => {
    const id = setInterval(() => setRemaining(getRemaining()), 60000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endDate]);

  return remaining;
}

export default function FestivalSpecials() {
  const [content, setContent] = useState({ offers: [], products: [], settings: {} });

  useEffect(() => {
    getPublicContent().then(setContent).catch(() => {});
  }, []);

  const festivalOffers = content.offers || [];
  const products = content.products || [];
  const settings = content.settings || {};
  const active = festivalOffers.filter((o) => o.active);

  return (
    <>
      <PageHeader
        eyebrow="Limited Time"
        title="Festival Specials"
        description="Seasonal collections and offers, available for a limited time only."
      />

      <section className="max-w-6xl mx-auto px-5 md:px-8 py-14 md:py-20 space-y-16">
        {active.length === 0 && (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">🎉</p>
            <p className="text-cocoa-soft/70 text-lg">No festival offers are running right now — check back soon!</p>
          </div>
        )}
        {active
          .sort((a, b) => a.priority - b.priority)
          .map((offer, i) => (
            <ScrollReveal key={offer.id} delay={i * 100}>
              <FestivalBlock offer={offer} products={products} whatsapp={settings.whatsapp} />
            </ScrollReveal>
          ))}
      </section>
    </>
  );
}

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
