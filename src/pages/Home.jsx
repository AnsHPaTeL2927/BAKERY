import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Sparkles, Heart, Leaf, ChefHat, ShieldCheck, Clock } from "lucide-react";
import { getPublicContent } from "../services/api";
import IcingDivider from "../components/IcingDivider";
import ProductCard from "../components/ProductCard";

const icons = [Heart, Leaf, Sparkles, ChefHat, Star, Clock, ShieldCheck];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export default function Home() {
  const [content, setContent] = useState({ settings: {}, categories: [], products: [], gallery: [], offers: [], testimonials: [] });

  useEffect(() => {
    getPublicContent().then(setContent).catch(() => {});
  }, []);

  const settings = content.settings || {};
  const categories = content.categories || [];
  const products = content.products || [];
  const galleryImages = content.gallery || [];
  const festivalOffers = content.offers || [];
  const reviews = content.testimonials || [];
  const heroImage = content.heroBanners?.[0]?.image || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=900&q=80";
  const whyChooseUs = [
    { title: "Homemade", detail: "Every order baked in a real home kitchen, not a factory line." },
    { title: "Fresh Ingredients", detail: "Sourced in small batches, never stocked for weeks." },
    { title: "Premium Quality", detail: "Belgian chocolate, real butter, no shortcuts." },
    { title: "Custom Designs", detail: "Your theme, your colours, your occasion." },
    { title: "Affordable Pricing", detail: "Celebration-worthy desserts without the markup." },
    { title: "Fresh Daily", detail: "Baked to order, never sitting in a display case." },
    { title: "Hygienic Kitchen", detail: "Clean process from mixing bowl to delivery box." },
  ];
  const activeOffer = festivalOffers.find((o) => o.active);
  const bestSellers = products.filter((p) => p.featured).slice(0, 6);
  const waLink = (message) => `https://wa.me/${settings.whatsapp || '918780652597'}?text=${encodeURIComponent(message)}`;

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-cream">
        <div className="max-w-6xl mx-auto px-5 md:px-8 pt-14 pb-20 md:pt-20 md:pb-28 grid md:grid-cols-2 gap-10 items-center">
          <motion.div initial="hidden" animate="show" variants={fadeUp}>
            <p className="font-script text-2xl md:text-3xl text-rose-deep mb-2">
              {settings.tagline || 'Homemade Cakes, Crafted with Love'}
            </p>
            <h1 className="font-display font-semibold text-4xl md:text-6xl leading-[1.05] text-cocoa">
              Homemade Cakes
              <br />
              Crafted with{" "}
              <span className="relative inline-block text-rose-deep">
                Love
                <svg
                  aria-hidden="true"
                  viewBox="0 0 200 20"
                  className="absolute -bottom-2 left-0 w-full h-4 text-blush"
                >
                  <path d="M2 15 Q 50 2, 100 12 T 198 10" stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
            <p className="mt-6 text-cocoa-soft/90 text-lg max-w-md">
              {settings.description || 'Freshly baked cakes, brownies, chocolates and desserts made for every celebration.'}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href={waLink("Hi! I'd like to place an order with Cakes by Tulsi.")}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-rose text-ivory font-semibold px-7 py-3.5 rounded-full hover:bg-rose-deep transition-colors shadow-md shadow-rose/30"
              >
                Order on WhatsApp
              </a>
              <Link
                to="/menu"
                className="border-2 border-cocoa/20 text-cocoa font-semibold px-7 py-3.5 rounded-full hover:border-rose hover:text-rose-deep transition-colors"
              >
                View Menu
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-blush rounded-[3rem] -rotate-3" aria-hidden="true" />
            <img
              src={heroImage}
              alt="Premium homemade chocolate truffle cake"
              className="relative rounded-[3rem] shadow-xl w-full aspect-[4/3] object-cover"
            />
          </motion.div>
        </div>
      </section>

      <IcingDivider className="text-blush" />

      {/* FESTIVAL OFFER BANNER */}
      {activeOffer && (
        <section className="max-w-6xl mx-auto px-5 md:px-8 py-14">
          <div className="relative rounded-[2rem] overflow-hidden bg-rose-deep text-ivory grid md:grid-cols-2 items-center">
            <div className="p-8 md:p-12 relative z-10">
              <p className="font-script text-3xl text-blush mb-1">{activeOffer.festival}</p>
              <h2 className="font-display font-semibold text-2xl md:text-4xl">{activeOffer.title}</h2>
              <p className="mt-3 text-ivory/85 max-w-sm">{activeOffer.description}</p>
              <div className="mt-5 inline-flex items-center gap-2 bg-gold text-cocoa font-bold px-4 py-1.5 rounded-full text-sm">
                {activeOffer.discount}
              </div>
              <div className="mt-6">
                <a
                  href={waLink(`Hi! I'd like to pre-order for ${activeOffer.festival} (${activeOffer.discount}).`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-ivory text-rose-deep font-semibold px-6 py-3 rounded-full hover:bg-blush transition-colors"
                >
                  {activeOffer.ctaText}
                </a>
              </div>
            </div>
            <div className="h-56 md:h-full">
              <img src={activeOffer.banner} alt="" className="w-full h-full object-cover opacity-90" />
            </div>
          </div>
        </section>
      )}

      {/* CATEGORIES */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 py-8 md:py-14">
        <SectionTitle eyebrow="What We Bake" title="Explore Our Categories" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-10">
          {categories.map((c) => (
            <Link
              key={c.slug || c.id}
              to={`/menu?category=${c.slug || c.id}`}
              className="group bg-ivory rounded-2xl border border-blush/60 p-4 text-center hover:shadow-lg hover:-translate-y-1 transition-all"
            >
              <div className="w-full aspect-square rounded-xl overflow-hidden mb-3">
                <img src={c.image || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80'} alt={c.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
              <p className="font-display font-semibold text-cocoa text-sm">{c.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* BEST SELLERS */}
      <section className="bg-blush-soft py-14 md:py-20">
        <div className="max-w-6xl mx-auto px-5 md:px-8">
          <SectionTitle eyebrow="Customer Favourites" title="Best Sellers" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
            {bestSellers.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/menu" className="font-semibold text-rose-deep hover:underline">
              View Full Menu →
            </Link>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 py-14 md:py-20">
        <SectionTitle eyebrow="The Tulsi Difference" title="Why Choose Us" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
          {whyChooseUs.map((item, i) => {
            const Icon = icons[i % icons.length];
            return (
              <div key={item.title} className="bg-ivory rounded-2xl border border-blush/60 p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-blush flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-rose-deep" />
                </div>
                <p className="font-display font-semibold text-cocoa mb-1">{item.title}</p>
                <p className="text-sm text-cocoa-soft/75">{item.detail}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CUSTOM CAKE BANNER */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 pb-14 md:pb-20">
        <div className="relative rounded-[2rem] overflow-hidden bg-cocoa text-cream grid md:grid-cols-2 items-center">
          <div className="p-8 md:p-12">
            <p className="font-script text-3xl text-blush mb-1">Made Just for You</p>
            <h2 className="font-display font-semibold text-2xl md:text-4xl">Custom Cakes for Every Occasion</h2>
            <p className="mt-3 text-cream/75 max-w-sm">
              Birthdays, anniversaries, weddings, baby showers, corporate events — tell us your vision and we'll bake it.
            </p>
            <Link
              to="/custom-cake"
              className="mt-6 inline-block bg-rose text-ivory font-semibold px-6 py-3 rounded-full hover:bg-rose-deep transition-colors"
            >
              Request Custom Cake
            </Link>
          </div>
          <div className="h-56 md:h-full">
            <img
              src="https://images.unsplash.com/photo-1519340333755-c1aa5571fd46?w=900&q=80"
              alt="Custom tiered celebration cake"
              className="w-full h-full object-cover opacity-90"
            />
          </div>
        </div>
      </section>

      {/* GALLERY PREVIEW */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 pb-14 md:pb-20">
        <SectionTitle eyebrow="A Peek Inside" title="Gallery" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
          {galleryImages.slice(0, 8).map((g) => (
            <div key={g.id} className="rounded-2xl overflow-hidden aspect-square">
              <img src={g.image} alt={g.alt || g.title} loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link to="/gallery" className="font-semibold text-rose-deep hover:underline">
            View Full Gallery →
          </Link>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="bg-blush-soft py-14 md:py-20">
        <div className="max-w-6xl mx-auto px-5 md:px-8">
          <SectionTitle eyebrow="Kind Words" title="What Our Customers Say" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
            {reviews.filter((r) => r.approved !== false).map((r) => (
              <div key={r.id} className="bg-ivory rounded-2xl border border-blush/60 p-6">
                <div className="flex gap-1 text-gold mb-3">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-gold" />
                  ))}
                </div>
                <p className="text-sm text-cocoa-soft/85 leading-relaxed">"{r.review}"</p>
                <div className="flex items-center gap-3 mt-4">
                  <img src={r.photo} alt="" className="w-9 h-9 rounded-full object-cover" />
                  <p className="font-semibold text-sm text-cocoa">{r.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT / WHATSAPP CTA */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 py-16 md:py-24 text-center">
        <p className="font-script text-3xl text-rose-deep mb-2">Ready to Order?</p>
        <h2 className="font-display font-semibold text-2xl md:text-4xl text-cocoa max-w-xl mx-auto">
          Message us on WhatsApp and let's plan your next celebration.
        </h2>
        <a
          href={waLink("Hi! I'd like to place an order with Cakes by Tulsi.")}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-block bg-rose text-ivory font-semibold px-8 py-4 rounded-full hover:bg-rose-deep transition-colors shadow-md shadow-rose/30"
        >
          Chat on WhatsApp
        </a>
      </section>
    </>
  );
}

function SectionTitle({ eyebrow, title }) {
  return (
    <div className="text-center">
      <p className="font-script text-2xl text-rose-deep mb-1">{eyebrow}</p>
      <h2 className="font-display font-semibold text-2xl md:text-4xl text-cocoa">{title}</h2>
    </div>
  );
}
