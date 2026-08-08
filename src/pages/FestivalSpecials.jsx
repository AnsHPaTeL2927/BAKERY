import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import { getPublicContent } from "../services/api";
import SafeImage from "../components/SafeImage";

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
          <p className="text-center text-cocoa-soft/70">No festival offers are running right now — check back soon!</p>
        )}
        {active
          .sort((a, b) => a.priority - b.priority)
          .map((offer) => (
            <FestivalBlock key={offer.id} offer={offer} products={products} whatsapp={settings.whatsapp} />
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
      <div className="relative rounded-[2rem] overflow-hidden">
        <SafeImage src={offer.banner} alt={offer.title} className="w-full h-64 md:h-80 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-cocoa/80 via-cocoa/20 to-transparent flex items-end">
          <div className="p-6 md:p-10 text-ivory">
            <p className="font-script text-3xl text-blush">{offer.festival}</p>
            <h2 className="font-display font-semibold text-2xl md:text-4xl">{offer.title}</h2>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <p className="text-cocoa-soft/80 max-w-xl">{offer.description}</p>
        <div className="flex items-center gap-4 shrink-0">
          <span className="bg-gold text-cocoa font-bold px-4 py-1.5 rounded-full text-sm">{offer.discount}</span>
          {countdown && (
            <span className="text-sm font-semibold text-rose-deep">
              {countdown.days}d {countdown.hours}h left
            </span>
          )}
        </div>
      </div>

      <div className="mt-6">
        <a
          href={waLink(`Hi! I'd like to order for ${offer.festival} (${offer.discount}).`)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-rose text-ivory font-semibold px-6 py-3 rounded-full hover:bg-rose-deep transition-colors"
        >
          {offer.ctaText}
        </a>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mt-8">
        {relatedProducts.map((p) => (
          <div key={p.id} className="rounded-2xl overflow-hidden bg-ivory border border-blush/60">
            <SafeImage src={p.image} alt={p.name} className="w-full aspect-[4/3] object-cover" loading="lazy" />
            <p className="p-3 font-display font-semibold text-sm text-cocoa">{p.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
