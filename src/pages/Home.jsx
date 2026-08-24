import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, Sparkles, Heart, Leaf, ChefHat, ShieldCheck, Clock, Quote, ChevronLeft, ChevronRight,
  Wheat, Flame, Palette, Gift, MessageCircle, ClipboardCheck, Truck, Plus, Minus, BadgeCheck,
} from "lucide-react";
import { getPublicContent } from "../services/api";
import { StarRatingDisplay } from "../components/StarRating";
import IcingDivider from "../components/IcingDivider";
import ProductCard from "../components/ProductCard";
import SafeImage from "../components/SafeImage";
import Skeleton from "../components/loading/Skeleton";
import CardSkeleton from "../components/loading/CardSkeleton";
import ScrollReveal from "../components/ScrollReveal";
import ParallaxLayer from "../components/ParallaxLayer";
import AnimatedButton from "../components/AnimatedButton";
import HeroCakeAccent from "../components/HeroCakeAccent";
import CinematicParticles from "../components/CinematicParticles";
import useCountdown from "../hooks/useCountdown";
import heroMobile from "../assets/hero-mobile.svg";
import heroDesktop from "../assets/hero-desktop.svg";
import cinematicHeroMobile from "../assets/cinematic-hero-mobile.webp";
import cinematicHeroDesktop from "../assets/cinematic-hero-desktop.webp";
import customCakeDefault from "../assets/custom-cake-hero.jpg";
import { buildPublicWhatsAppLink } from "../utils/whatsapp";

// An internal path (starts with "/") should route through React Router;
// anything else (wa.me links, tel:, external URLs) is a plain anchor.
function isInternalLink(link) {
  return typeof link === "string" && link.startsWith("/");
}

const icons = [Heart, Leaf, Sparkles, ChefHat, Star, Clock, ShieldCheck];

/* ─── Our Process — the craft story, told as a numbered sequence ──── */
const processSteps = [
  { title: "Finest Ingredients", desc: "Hand-picked butter, Belgian chocolate and seasonal fruit — sourced in small batches.", Icon: Wheat },
  { title: "Crafted by Hand", desc: "Every layer is mixed, folded and shaped by hand. No pre-mixes, no shortcuts.", Icon: ChefHat },
  { title: "Baked to Order", desc: "Slow-baked in small batches on the day of your event — never mass-produced.", Icon: Flame },
  { title: "Finished with Precision", desc: "Piped, layered and decorated to match the theme you asked for.", Icon: Palette },
  { title: "Ready to Celebrate", desc: "Boxed, protected and handed over fresh for pickup or delivery.", Icon: Gift },
];

/* ─── Custom cake ordering journey ───────────────────────────────── */
const orderSteps = [
  { title: "Share your brief", desc: "Occasion, date, flavour, theme and budget — a rough idea is enough to start.", Icon: MessageCircle },
  { title: "Approve the quote", desc: "We confirm the design, weight and price on WhatsApp before anything is baked.", Icon: ClipboardCheck },
  { title: "Collect or get it delivered", desc: "Baked fresh on your date and ready exactly when you need it.", Icon: Truck },
];

/* ─── FAQ — the questions that actually block an order ───────────── */
const faqs = [
  {
    q: "How far in advance should I place my order?",
    a: "For regular cakes, 24–48 hours is usually enough. For custom or tiered designs — and around festivals — we recommend 3 to 5 days so we can reserve your date and source anything special.",
  },
  {
    q: "Can you make a cake to a specific design or theme?",
    a: "Yes — custom work is what we do most. Send a reference photo or just describe the idea, and we'll come back with what's achievable, the right weight and a firm quote.",
  },
  {
    q: "How is the price decided?",
    a: "Price depends on weight, flavour and how detailed the decoration is. You'll always get the final figure confirmed on WhatsApp before we begin, so there are no surprises later.",
  },
  {
    q: "Do you deliver, or is it pickup only?",
    a: "Both. Pickup is available from our kitchen at a time we agree, and delivery can be arranged for most orders — just mention it when you enquire and we'll confirm availability for your area.",
  },
  {
    q: "How do I actually place an order?",
    a: "Message us on WhatsApp with your requirement, or fill in the Custom Cake form on this site — it opens a pre-filled WhatsApp chat with all your details ready to send.",
  },
  {
    q: "How fresh is the cake?",
    a: "Every order is baked to order, not taken from a display case. Your cake is made close to your event date so it reaches you at its best.",
  },
];

export default function Home() {
  const [content, setContent] = useState({ settings: {}, categories: [], products: [], gallery: [], offers: [], testimonials: [], heroBanners: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicContent()
      .then(setContent)
      .finally(() => setLoading(false));
  }, []);

  const settings = content.settings || {};
  const categories = content.categories || [];
  const products = content.products || [];
  const galleryImages = content.gallery || [];
  const festivalOffers = content.offers || [];
  const reviews = content.testimonials || [];
  const liveHeroBanners = (content.heroBanners || []).filter((b) => !b.status || b.status === "LIVE");
  const whyChooseUs = [
    { title: "Homemade", detail: "Every order baked in a real home kitchen, not a factory line." },
    { title: "Fresh Ingredients", detail: "Sourced in small batches, never stocked for weeks." },
    { title: "Premium Quality", detail: "Belgian chocolate, real butter, no shortcuts." },
    { title: "Custom Designs", detail: "Your theme, your colours, your occasion." },
    { title: "Affordable Pricing", detail: "Celebration-worthy desserts without the markup." },
    { title: "Fresh Daily", detail: "Baked to order, never sitting in a display case." },
    { title: "Hygienic Kitchen", detail: "Clean process from mixing bowl to delivery box." },
  ];
  // Date-aware: an offer past its own `endDate` never renders here, even if
  // an admin forgot to flip its "active" toggle off (see server's getOffers).
  const activeOffer = festivalOffers.find((o) => o.isCurrentlyActive ?? o.active);
  // Published reviews only — the public endpoint already filters to
  // approved+LIVE, so this average is the real, moderated score and never
  // includes anything sitting in the admin's approval queue.
  const publishedReviews = reviews.filter((r) => r.approved !== false);
  const reviewCount = publishedReviews.length;
  const averageRating = reviewCount
    ? publishedReviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / reviewCount
    : 0;
  const bestSellers = products.filter((p) => p.featured).slice(0, 6);
  // No products flagged "featured" yet shouldn't mean an empty Best Sellers
  // grid — fall back to whatever is in the live catalog so the section
  // always has something worth showing.
  const bestSellersDisplay = bestSellers.length > 0 ? bestSellers : products.slice(0, 6);
  const bestSellerTeaser = bestSellers.slice(0, 3);
  const waLink = (message) => buildPublicWhatsAppLink(settings.whatsapp, message);

  return (
    <>
      {/* ═══ HERO ═══ */}
      <HeroSection
        banners={liveHeroBanners}
        settings={settings}
        waLink={waLink}
        loading={loading}
        averageRating={averageRating}
        reviewCount={reviewCount}
      />

      {/* ═══ TRUST BAR ═══ */}
      <TrustBar averageRating={averageRating} reviewCount={reviewCount} loading={loading} />

      <IcingDivider className="text-blush" />

      {/* ═══ DYNAMIC OFFER BANNER ═══ */}
      {/* Three states: loading (skeleton), an active offer (urgency), or —
          the common case — no offer running, which must never look like a
          missing/broken section, so it transforms into evergreen marketing
          content instead. See OfferFallbackBanner below. */}
      {loading ? (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-10 md:py-14">
          <Skeleton className="h-64 sm:h-80 rounded-3xl sm:rounded-[2.5rem]" />
        </div>
      ) : activeOffer ? (
        <ScrollReveal className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-10 md:py-14">
          <div className="relative rounded-3xl sm:rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-rose-deep via-rose-deep to-[#7E2844] text-ivory grid md:grid-cols-12 items-center group shadow-md border border-rose/30">
            {/* Ambient backdrop */}
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gold/15 blur-3xl pointer-events-none" />

            <div className="p-6 sm:p-9 md:p-10 lg:p-12 md:col-span-7 relative z-10">
              <p className="font-script text-2xl sm:text-3xl text-blush mb-1 tracking-wide">{activeOffer.festival}</p>
              <h2 className="font-display font-semibold text-2xl sm:text-3xl md:text-4xl leading-tight">{activeOffer.title}</h2>
              <p className="mt-2.5 sm:mt-3 text-ivory/85 text-xs sm:text-sm md:text-base max-w-lg leading-relaxed">{activeOffer.description}</p>
              <div className="mt-4 sm:mt-5 flex flex-wrap items-center gap-2.5 sm:gap-3">
                <div className="inline-flex items-center gap-2 bg-gold text-cocoa font-bold px-3.5 py-1.5 sm:px-4 sm:py-1.5 rounded-full text-xs sm:text-sm shadow-xs">
                  {activeOffer.discount}
                </div>
                <OfferCountdown endDate={activeOffer.endDate} />
              </div>
              <div className="mt-5 sm:mt-7">
                <AnimatedButton
                  href={waLink(`Hi! I'd like to pre-order for ${activeOffer.festival} (${activeOffer.discount}).`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="secondary"
                  className="!border-ivory !text-ivory hover:!bg-ivory/15"
                  arrow
                >
                  {activeOffer.ctaText}
                </AnimatedButton>
              </div>
            </div>

            <div className="h-52 sm:h-64 md:h-full md:min-h-[280px] md:col-span-5 img-zoom-container relative">
              <SafeImage src={activeOffer.banner} alt="" className="w-full h-full object-cover opacity-90 img-zoom-target" />
              <div className="absolute inset-0 bg-gradient-to-t from-cocoa/40 via-transparent to-transparent lg:hidden" />
            </div>
          </div>
        </ScrollReveal>
      ) : (
        <OfferFallbackBanner products={bestSellerTeaser} />
      )}

      {/* ═══ CATEGORIES ═══ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-12 md:py-16">
        <ScrollReveal>
          <SectionTitle eyebrow="What We Bake" title="Explore Our Categories" />
        </ScrollReveal>
        {loading ? (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2.5 sm:gap-4 mt-6 sm:mt-10">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl sm:rounded-2xl border border-blush/60 bg-ivory p-2.5 sm:p-4 text-center">
                <Skeleton className="mb-2 aspect-square w-full rounded-lg sm:rounded-xl" />
                <Skeleton className="mx-auto h-3 w-2/3" />
              </div>
            ))}
          </div>
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2.5 sm:gap-4 mt-6 sm:mt-10">
            {categories.map((c, i) => (
              <ScrollReveal key={c.slug || c.id} delay={i * 50} distance={16}>
                <Link
                  to={`/menu?category=${c.slug || c.id}`}
                  className="group bg-ivory rounded-xl sm:rounded-2xl border border-blush/50 p-2.5 sm:p-4 text-center card-hover block h-full"
                >
                  <div className="w-full aspect-square rounded-lg sm:rounded-xl img-zoom-container mb-2 sm:mb-3 relative overflow-hidden bg-cream-deep/30">
                    <SafeImage
                      src={c.image}
                      alt={c.name}
                      loading="lazy"
                      blurLoad
                      showSkeleton
                      containerClassName="w-full h-full"
                      className="w-full h-full object-cover img-zoom-target"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-cocoa/15 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <p className="font-display font-semibold text-cocoa text-xs sm:text-sm line-clamp-1">{c.name}</p>
                  {c.description && (
                    <p className="mt-0.5 text-[11px] sm:text-xs text-cocoa-soft/65 leading-snug line-clamp-1 hidden sm:block">{c.description}</p>
                  )}
                </Link>
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <ScrollReveal className="mt-6 sm:mt-10 text-center rounded-3xl border border-blush/50 bg-ivory py-10 sm:py-14 px-5">
            <Sparkles className="w-8 h-8 sm:w-9 sm:h-9 text-rose/40 mx-auto mb-3" strokeWidth={1.5} aria-hidden="true" />
            <p className="font-display font-semibold text-cocoa text-base sm:text-lg mb-2">Fresh Bakes, Ready to Explore</p>
            <p className="text-cocoa-soft/70 text-xs sm:text-sm max-w-sm mx-auto mb-5">
              Browse our full menu of homemade cakes and treats — new categories are added all the time.
            </p>
            <AnimatedButton to="/menu" arrow>
              View Full Menu
            </AnimatedButton>
          </ScrollReveal>
        )}
      </section>

      {/* ═══ BEST SELLERS ═══ */}
      <section className="bg-blush-soft/50 py-10 sm:py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
          <ScrollReveal>
            <SectionTitle
              eyebrow="Customer Favourites"
              title="Our Most Loved Cakes"
              description="The cakes our customers keep coming back for."
            />
          </ScrollReveal>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-6 mt-6 sm:mt-10">
              {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : bestSellersDisplay.length > 0 ? (
            <div className="mt-6 sm:mt-10 grid grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-6">
              {bestSellersDisplay.map((p, i) => (
                <ScrollReveal key={p.id} delay={i * 60} distance={16}>
                  <ProductCard product={p} whatsapp={settings.whatsapp} />
                </ScrollReveal>
              ))}
            </div>
          ) : (
            <ScrollReveal className="mt-6 sm:mt-10 text-center rounded-3xl border border-blush/50 bg-ivory py-10 sm:py-14 px-5">
              <ChefHat className="w-8 h-8 sm:w-9 sm:h-9 text-rose/40 mx-auto mb-3" strokeWidth={1.5} aria-hidden="true" />
              <p className="font-display font-semibold text-cocoa text-base sm:text-lg mb-2">Fresh Batches Coming Very Soon</p>
              <p className="text-cocoa-soft/70 text-xs sm:text-sm max-w-sm mx-auto mb-5">
                Our menu is being updated — message us on WhatsApp and we'll tell you what's fresh out of the oven today.
              </p>
              <AnimatedButton
                href={waLink("Hi! What cakes do you have available today?")}
                target="_blank"
                rel="noopener noreferrer"
                arrow
              >
                Ask on WhatsApp
              </AnimatedButton>
            </ScrollReveal>
          )}

          {!loading && bestSellersDisplay.length > 0 && (
            <ScrollReveal className="text-center mt-6 sm:mt-10">
              <AnimatedButton to="/menu" variant="secondary" arrow>
                View Full Menu
              </AnimatedButton>
            </ScrollReveal>
          )}
        </div>
      </section>

      {/* ═══ WHY CHOOSE US ═══ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-10 sm:py-16 md:py-24">
        <ScrollReveal>
          <SectionTitle eyebrow="The Tulsi Difference" title="Why Choose Us" />
        </ScrollReveal>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-5 mt-6 sm:mt-10">
          {whyChooseUs.map((item, i) => {
            const Icon = icons[i % icons.length];
            return (
              <ScrollReveal key={item.title} delay={i * 50} distance={16}>
                <div className="bg-ivory rounded-xl sm:rounded-2xl border border-blush/50 p-3.5 sm:p-6 text-center card-hover h-full flex flex-col items-center justify-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blush to-blush-soft flex items-center justify-center mb-2 sm:mb-4 shrink-0">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-rose-deep" />
                  </div>
                  <p className="font-display font-semibold text-cocoa text-xs sm:text-base mb-0.5 sm:mb-1">{item.title}</p>
                  <p className="text-[11px] sm:text-sm text-cocoa-soft/70 leading-tight sm:leading-relaxed">{item.detail}</p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      {/* ═══ OUR PROCESS ═══ */}
      <ProcessSection />

      {/* ═══ CUSTOM CAKE ═══ */}
      <CustomCakeSection waLink={waLink} />

      {/* ═══ GALLERY PREVIEW ═══ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 pb-10 sm:pb-16 md:pb-24">
        <ScrollReveal>
          <SectionTitle eyebrow="A Peek Inside" title="Gallery" />
        </ScrollReveal>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 sm:gap-4 mt-6 sm:mt-10">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl sm:rounded-2xl" />)
            : galleryImages.slice(0, 6).map((g, i) => (
                <ScrollReveal key={g.id} delay={i * 40} distance={12}>
                  <div className="rounded-xl sm:rounded-2xl overflow-hidden aspect-square img-zoom-container bg-cream-deep/30">
                    <SafeImage
                      src={g.image}
                      alt={g.alt || g.title}
                      loading="lazy"
                      blurLoad
                      showSkeleton
                      containerClassName="w-full h-full"
                      className="w-full h-full object-cover img-zoom-target"
                    />
                  </div>
                </ScrollReveal>
              ))}
        </div>
        {!loading && galleryImages.length > 0 && (
          <ScrollReveal className="text-center mt-6 sm:mt-10">
            <AnimatedButton to="/gallery" variant="secondary" arrow>
              View Full Gallery
            </AnimatedButton>
          </ScrollReveal>
        )}
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      {/* Renders even with zero published reviews — an empty reviews section is
          a conversion opportunity ("be the first"), not something to hide. */}
      {!loading && (
        <TestimonialsSection reviews={publishedReviews} averageRating={averageRating} />
      )}

      {/* ═══ FAQ ═══ */}
      <FaqSection waLink={waLink} />

      {/* ═══ FINAL CTA ═══ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blush-soft via-cream to-blush-soft/50" />
        <ParallaxLayer speed={0.08} className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-16 right-[12%] w-72 h-72 rounded-full bg-blush/40 blur-3xl" />
          <div className="absolute -bottom-20 left-[8%] w-64 h-64 rounded-full bg-rose/10 blur-3xl" />
        </ParallaxLayer>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-12 sm:py-20 md:py-32 text-center">
          <ScrollReveal>
            <p className="font-script text-2xl sm:text-3xl md:text-4xl text-rose-deep mb-2">Ready to Order?</p>
            <h2 className="font-display font-semibold text-2xl sm:text-4xl md:text-5xl text-cocoa max-w-2xl mx-auto leading-tight">
              Make Every Celebration Sweeter
            </h2>
            <p className="mt-3 sm:mt-4 text-cocoa-soft/70 max-w-md mx-auto text-sm sm:text-lg">
              Message us on WhatsApp and let's plan your next celebration.
            </p>
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-xs sm:max-w-none mx-auto">
              <AnimatedButton
                href={waLink("Hi! I'd like to place an order with Cakes by Tulsi.")}
                target="_blank"
                rel="noopener noreferrer"
                size="lg"
                className="w-full sm:w-auto justify-center"
                arrow
              >
                Order Your Cake
              </AnimatedButton>
              <AnimatedButton to="/custom-cake" variant="secondary" size="lg" className="w-full sm:w-auto justify-center" arrow>
                Create Custom Cake
              </AnimatedButton>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}

/* ═══ TRUST BAR ═══ */
// The first thing below the hero: four reasons to keep scrolling. The rating
// tile is driven by real published reviews and simply drops out when there are
// none yet — an invented score would be worse than no score.
function TrustBar({ averageRating, reviewCount, loading }) {
  const items = [
    reviewCount > 0 && {
      key: "rating",
      Icon: Star,
      title: `${averageRating.toFixed(1)} out of 5`,
      detail: `Rated by ${reviewCount} customer${reviewCount === 1 ? "" : "s"}`,
      to: "/reviews",
    },
    { key: "fresh", Icon: Flame, title: "Baked to Order", detail: "Never pre-made, never from a display case" },
    { key: "custom", Icon: Palette, title: "Fully Customisable", detail: "Your theme, flavour, colours and message" },
    { key: "whatsapp", Icon: MessageCircle, title: "Order in Minutes", detail: "Straight from WhatsApp — no app, no account" },
  ].filter(Boolean);

  return (
    <section className="py-6 sm:py-9 bg-blush-soft/25 relative z-10 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-ivory/80 rounded-2xl p-4 border border-blush/40">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
        ) : (
          <ul className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4.5">
            {items.map(({ key, Icon, title, detail, to }, i) => {
              const body = (
                <>
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-blush-soft/80 flex items-center justify-center shrink-0 text-rose group-hover:scale-110 group-hover:rotate-[6deg] group-hover:bg-rose group-hover:text-ivory transition-all duration-300 ease-out shadow-2xs">
                    <Icon className="w-4.5 h-4.5 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:scale-105" strokeWidth={1.75} aria-hidden="true" />
                  </div>
                  <span className="min-w-0">
                    <span className="block font-display font-semibold text-cocoa text-xs sm:text-sm md:text-base leading-tight sm:leading-snug group-hover:text-rose-deep transition-colors duration-300">
                      {title}
                    </span>
                    <span className="block text-[11px] sm:text-xs md:text-sm text-cocoa-soft/70 group-hover:text-cocoa leading-tight sm:leading-snug mt-0.5 sm:mt-1 transition-colors duration-300">
                      {detail}
                    </span>
                  </span>
                </>
              );
              return (
                <ScrollReveal as="li" key={key} delay={i * 70} distance={16} className="h-full">
                  {to ? (
                    <Link
                      to={to}
                      className="group flex items-start gap-2.5 sm:gap-3.5 bg-ivory/90 hover:bg-ivory rounded-2xl sm:rounded-3xl border border-blush/60 p-3.5 sm:p-5 shadow-2xs hover:shadow-md hover:shadow-rose/10 hover:border-rose/50 hover:-translate-y-1 sm:hover:-translate-y-1.5 active:translate-y-0 active:scale-[0.98] transition-all duration-300 ease-out h-full"
                    >
                      {body}
                    </Link>
                  ) : (
                    <div className="group flex items-start gap-2.5 sm:gap-3.5 bg-ivory/90 hover:bg-ivory rounded-2xl sm:rounded-3xl border border-blush/60 p-3.5 sm:p-5 shadow-2xs hover:shadow-md hover:shadow-rose/10 hover:border-rose/50 hover:-translate-y-1 sm:hover:-translate-y-1.5 active:translate-y-0 active:scale-[0.98] transition-all duration-300 ease-out h-full">
                      {body}
                    </div>
                  )}
                </ScrollReveal>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

/* ═══ OUR PROCESS ═══ */
// Numbered, icon-led sequence on the dark panel. On mobile it reads as a
// vertical timeline with a connecting rail (one step at a time, no cramped
// 2-column grid); from `lg` it opens into the five-across row.
function ProcessSection() {
  return (
    <section className="relative bg-cocoa text-cream overflow-hidden">
      <div className="absolute inset-0 opacity-[0.07] pointer-events-none">
        <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-rose blur-3xl" />
        <div className="absolute bottom-10 right-10 w-56 h-56 rounded-full bg-gold blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-10 sm:py-16 md:py-28">
        <ScrollReveal>
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blush mb-2 sm:mb-3">Our Process</p>
            <h2 className="font-display font-semibold text-2xl sm:text-3xl md:text-4xl text-cream">From Kitchen to Celebration</h2>
            <p className="mt-2.5 sm:mt-4 text-cream/60 text-xs sm:text-sm md:text-base max-w-lg mx-auto leading-relaxed">
              Five steps, every single order — so you know exactly what you're paying for.
            </p>
          </div>
        </ScrollReveal>

        <div className="relative">
          {/* Vertical rail (mobile/tablet) becomes a horizontal one on desktop. */}
          <span
            aria-hidden="true"
            className="absolute left-[21px] sm:left-[27px] top-4 bottom-4 w-px bg-cream/15 lg:left-0 lg:right-0 lg:top-7 lg:bottom-auto lg:h-px lg:w-auto lg:mx-[10%]"
          />

          <ol className="relative grid gap-6 sm:gap-8 md:grid-cols-5 md:gap-4 lg:gap-6">
            {processSteps.map((step, i) => (
              <ScrollReveal as="li" key={step.title} delay={i * 70} distance={16} className="relative">
                <div className="flex gap-4 sm:gap-5 md:flex-col md:items-center md:text-center md:gap-0">
                  {/* Numbered icon medallion */}
                  <span className="relative shrink-0 w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-cocoa border border-cream/15 flex items-center justify-center md:mx-auto shadow-2xs">
                    <step.Icon className="w-5 h-5 sm:w-6 sm:h-6 text-blush" strokeWidth={1.5} aria-hidden="true" />
                    <span className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-rose text-ivory text-[10px] sm:text-[11px] font-bold flex items-center justify-center tabular-nums shadow-2xs">
                      {i + 1}
                    </span>
                  </span>
                  <div className="pt-0.5 md:pt-4">
                    <p className="font-display font-semibold text-cream text-sm sm:text-base mb-1">{step.title}</p>
                    <p className="text-cream/65 text-xs sm:text-sm leading-relaxed md:px-1">{step.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ═══ CUSTOM CAKE ═══ */
// The single highest-intent block on the page, so it gets the full treatment:
// the ordering journey spelled out, the objections answered inline, and two
// CTAs side by side (form for people who want to specify, WhatsApp for people
// who just want to talk).
function CustomCakeSection({ waLink }) {
  const assurances = [
    "Quote confirmed before we bake — no surprise pricing",
    "Reference photos welcome; we'll tell you what's achievable",
    "Eggless and flavour substitutions on request",
  ];

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-10 sm:py-16 md:py-24">
      <ScrollReveal>
        <div className="relative rounded-3xl sm:rounded-[2.5rem] overflow-hidden bg-cocoa text-cream shadow-md border border-cream/10">
          <ParallaxLayer speed={0.05} className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-rose/10 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-gold/10 blur-2xl" />
          </ParallaxLayer>

          <div className="relative grid md:grid-cols-2">
            {/* Copy + journey */}
            <div className="p-5 sm:p-8 md:p-10 lg:p-12 order-1 md:order-1">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blush mb-2 sm:mb-3">Custom Orders</p>
              <h2 className="font-display font-semibold text-2xl sm:text-3xl lg:text-4xl leading-tight">
                Your Occasion, Baked to Your Brief
              </h2>
              <p className="mt-2.5 sm:mt-4 text-cream/70 text-xs sm:text-sm md:text-base leading-relaxed max-w-md">
                Birthdays, anniversaries, weddings, baby showers and corporate gifting — describe what you have in mind and
                we'll turn it into a cake, with the price agreed up front.
              </p>

              {/* Ordering journey */}
              <ol className="mt-6 sm:mt-8 space-y-4 sm:space-y-5">
                {orderSteps.map((step, i) => (
                  <li key={step.title} className="flex gap-3.5 sm:gap-4">
                    <span className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-cream/10 border border-cream/15 flex items-center justify-center shadow-2xs">
                      <step.Icon className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-blush" strokeWidth={1.75} aria-hidden="true" />
                    </span>
                    <div className="pt-0.5">
                      <p className="font-semibold text-cream text-xs sm:text-sm">
                        <span className="text-blush/70 tabular-nums mr-1.5">{String(i + 1).padStart(2, "0")}</span>
                        {step.title}
                      </p>
                      <p className="text-cream/60 text-xs sm:text-sm leading-relaxed mt-0.5">{step.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>

              {/* Objection handling */}
              <ul className="mt-6 sm:mt-8 space-y-2 border-t border-cream/10 pt-5 sm:pt-6">
                {assurances.map((line) => (
                  <li key={line} className="flex items-start gap-2 text-xs sm:text-sm text-cream/75">
                    <BadgeCheck className="w-4 h-4 text-gold shrink-0 mt-0.5" strokeWidth={1.75} aria-hidden="true" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row flex-wrap gap-2.5 sm:gap-3">
                <AnimatedButton to="/custom-cake" arrow className="justify-center w-full sm:w-auto">
                  Start Your Custom Cake
                </AnimatedButton>
                <AnimatedButton
                  href={waLink("Hi! I'd like to discuss a custom cake.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="secondary"
                  className="!border-ivory/40 !text-ivory hover:!bg-ivory/10 justify-center w-full sm:w-auto"
                >
                  Ask a Question First
                </AnimatedButton>
              </div>
            </div>

            {/* Image */}
            <div className="relative h-52 sm:h-72 md:h-auto md:min-h-[480px] lg:min-h-[520px] img-zoom-container order-2 md:order-2">
              <SafeImage
                src={customCakeDefault}
                fallback={customCakeDefault}
                alt="Custom tiered celebration cake"
                containerClassName="w-full h-full"
                className="w-full h-full object-cover img-zoom-target"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-cocoa/70 via-cocoa/10 to-transparent md:bg-gradient-to-r md:from-cocoa md:via-cocoa/25 md:to-transparent"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}

/* ═══ FAQ ═══ */
// Accordion of the questions that actually stall an order. Single-open, native
// buttons + aria-expanded (no library), and a "still unsure" WhatsApp escape
// hatch at the bottom so an unanswered question never becomes a dead end.
function FaqSection({ waLink }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-10 sm:py-16 md:py-24">
      <ScrollReveal>
        <SectionTitle
          eyebrow="Before You Order"
          title="Frequently Asked Questions"
          description="The things customers ask us most, answered up front."
        />
      </ScrollReveal>

      <div className="mt-6 sm:mt-10 divide-y divide-blush/50 border-y border-blush/50">
        {faqs.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <ScrollReveal key={item.q} delay={Math.min(i, 4) * 50} distance={16}>
              <h3>
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  className="w-full flex items-start justify-between gap-4 py-4 sm:py-5 text-left group"
                >
                  <span className={`font-display font-semibold text-xs sm:text-base md:text-lg transition-colors duration-200 ${isOpen ? "text-rose-deep" : "text-cocoa group-hover:text-rose-deep"}`}>
                    {item.q}
                  </span>
                  <span className="shrink-0 mt-0.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-blush flex items-center justify-center text-rose-deep transition-colors duration-200 group-hover:bg-blush-soft">
                    {isOpen ? <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                  </span>
                </button>
              </h3>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="pb-5 sm:pb-6 pr-6 sm:pr-10 text-xs sm:text-sm md:text-base text-cocoa-soft/80 leading-relaxed">{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </ScrollReveal>
          );
        })}
      </div>

      <ScrollReveal className="mt-6 sm:mt-8 text-center" delay={100}>
        <p className="text-cocoa-soft/70 text-xs sm:text-sm">
          Still have a question?{" "}
          <a
            href={waLink("Hi! I have a question before ordering.")}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-rose-deep hover:text-rose transition-colors link-underline"
          >
            Ask us on WhatsApp
          </a>{" "}
          — we usually reply the same day.
        </p>
      </ScrollReveal>
    </section>
  );
}

/* ═══ OFFER COUNTDOWN BADGE ═══ */
function OfferCountdown({ endDate }) {
  const remaining = useCountdown(endDate);
  if (!remaining) return null;
  return (
    <span className="text-sm font-semibold text-ivory bg-ivory/15 px-3 py-1.5 rounded-full">
      {remaining.days}d {remaining.hours}h left
    </span>
  );
}

/* ═══ OFFER BANNER — EVERGREEN FALLBACK ═══ */
// Shown instead of the offer banner whenever nothing is currently running.
// Same panel treatment as the real offer (so nothing about the page layout
// jumps), but the message and CTA are always-true marketing, never a
// "no offers" placeholder.
function OfferFallbackBanner({ products }) {
  const hasProducts = products.length > 0;
  return (
    <ScrollReveal className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-10 md:py-14">
      <div className="relative rounded-3xl sm:rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-rose-deep via-rose-deep to-[#7E2844] text-ivory grid md:grid-cols-12 items-center gap-2 sm:gap-6 shadow-md border border-rose/30">
        {/* Ambient background glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-rose/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-gold/10 blur-2xl pointer-events-none" />

        {/* Text Content */}
        <div className="p-6 sm:p-9 md:p-10 lg:p-12 md:col-span-7 relative z-10">
          <p className="font-script text-2xl sm:text-3xl text-blush mb-1 tracking-wide">
            Something Sweet Is Always Baking
          </p>
          <h2 className="font-display font-semibold text-2xl sm:text-3xl md:text-4xl leading-tight">
            Our Customers' Favourites
          </h2>
          <p className="mt-2.5 sm:mt-3 text-ivory/85 text-xs sm:text-sm md:text-base max-w-lg leading-relaxed">
            Discover the cakes our customers keep coming back for — freshly baked, every single day.
          </p>
          <div className="mt-5 sm:mt-7">
            <AnimatedButton
              to="/menu"
              variant="secondary"
              className="!border-ivory !text-ivory hover:!bg-ivory/15"
              arrow
            >
              Shop Best Sellers
            </AnimatedButton>
          </div>
        </div>

        {/* Product Image Grid */}
        <div className="p-6 pt-0 sm:p-8 md:p-10 md:pl-0 md:col-span-5 relative z-10 flex items-center justify-center">
          {hasProducts ? (
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 w-full max-w-md lg:max-w-none">
              {products.slice(0, 3).map((p) => (
                <Link
                  key={p.id}
                  to={p.category ? `/menu?category=${p.category}` : "/menu"}
                  className="group/item relative rounded-xl sm:rounded-2xl overflow-hidden aspect-square img-zoom-container border-2 border-ivory/20 shadow-sm block hover:border-ivory/60 transition-all duration-300"
                  title={p.name}
                >
                  <SafeImage
                    src={p.image}
                    alt={p.name}
                    loading="lazy"
                    containerClassName="w-full h-full"
                    className="w-full h-full object-cover img-zoom-target"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-cocoa/70 via-transparent to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 flex items-end p-2">
                    <span className="text-[10px] font-semibold text-ivory truncate w-full">{p.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="w-full py-8 flex items-center justify-center" aria-hidden="true">
              <ChefHat className="w-16 h-16 sm:w-20 sm:h-20 text-ivory/25" strokeWidth={1} />
            </div>
          )}
        </div>
      </div>
    </ScrollReveal>
  );
}

/* ═══ HERO SECTION ═══ */
function HeroSection({ banners, settings, waLink, loading, averageRating, reviewCount }) {
  const [current, setCurrent] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const heroRef = useRef(null);
  const autoPlayRef = useRef(null);
  const touchRef = useRef({ startX: 0 });

  const hasBanners = banners.length > 0;
  const hasMultiple = banners.length > 1;
  const activeBanner = hasBanners ? banners[current] : null;
  const bannerImage = hasBanners ? (activeBanner?.image || null) : null;
  const heroTitle = activeBanner?.title;
  const heroSubtitle = activeBanner?.subtitle;
  // Only treat the banner's own CTA as the primary hero action when the
  // admin has actually configured both a label and a destination for it —
  // otherwise fall back to the evergreen "Explore Cakes" CTA below.
  const campaignCta = activeBanner?.ctaText && activeBanner?.ctaLink ? activeBanner : null;

  // Autoplay carousel
  useEffect(() => {
    if (!hasMultiple) return;
    autoPlayRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(autoPlayRef.current);
  }, [hasMultiple, banners.length]);

  const goTo = useCallback((index) => {
    setCurrent(index);
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    autoPlayRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 5000);
  }, [banners.length]);

  // Mouse parallax — desktop only, and tracked live rather than read once at
  // mount, so rotating/resizing down to the mobile hero actually unbinds it.
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const el = heroRef.current;
    if (!el) return;
    const handler = (e) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      setMousePos({ x, y });
    };
    const apply = () => {
      el.removeEventListener("mousemove", handler);
      if (mql.matches) el.addEventListener("mousemove", handler);
      else setMousePos({ x: 0, y: 0 });
    };
    apply();
    mql.addEventListener("change", apply);
    return () => {
      mql.removeEventListener("change", apply);
      el.removeEventListener("mousemove", handler);
    };
  }, []);



  // Touch/swipe for mobile carousel
  const onTouchStart = (e) => { touchRef.current.startX = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (!hasMultiple) return;
    const diff = touchRef.current.startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goTo((current + 1) % banners.length);
      else goTo((current - 1 + banners.length) % banners.length);
    }
  };

  return (
    <section
      ref={heroRef}
      // -mt-16 cancels <main>'s pt-16 so the mobile photo runs edge-to-edge
      // behind the fixed navbar. Desktop keeps its original offset.
      className="relative overflow-hidden bg-cream -mt-16 md:mt-0"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Decorative background elements — desktop only; on mobile the
          full-bleed photo occupies this space instead. */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden hidden md:block">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-blush/30 blur-3xl animate-gentle-pulse" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-rose/10 blur-3xl" style={{ animationDelay: "1.5s" }} />
      </div>

      {/* ═══ MOBILE HERO — cinematic full-bleed ════════════════════════
          Deliberately NOT the desktop two-column layout scaled down. On a
          phone the cake photo IS the pitch, so it runs edge-to-edge behind
          the navbar and the copy sits on top of it. This is also the first
          time the admin's uploaded hero banners render on mobile at all —
          the old markup hid the entire image column below md.            */}
      <div className="md:hidden relative h-[90svh] min-h-[560px] max-h-[880px] w-full overflow-hidden">
        {/* Cinematic Particle & Bokeh Overlay */}
        <CinematicParticles particleCount={16} />

        {/* Dynamic Light Spotlight Beam Sweep */}
        <div className="cinematic-spotlight" aria-hidden="true" />

        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, scale: 1.12 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 overflow-hidden"
          >
            {/* Ken-Burns subtle panning visual container */}
            <div className="w-full h-full animate-ken-burns">
              <SafeImage
                src={bannerImage || cinematicHeroMobile}
                fallback={cinematicHeroMobile}
                alt={heroTitle || "Freshly baked homemade cake"}
                className="w-full h-full object-cover"
                fetchPriority="high"
                decoding="async"
              />
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Multilayered cinematic dark scrims for rich mood & maximum text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-cocoa via-cocoa/70 via-45% to-cocoa/15 pointer-events-none" aria-hidden="true" />
        <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-cream/90 via-cream/50 to-transparent pointer-events-none" aria-hidden="true" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(199,154,62,0.15),transparent_60%)] pointer-events-none" aria-hidden="true" />

        <div className="absolute inset-x-0 bottom-0 px-5 pb-7 pt-20 z-20">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Cinematic Glassmorphic Tag */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ivory/15 backdrop-blur-md border border-gold/30 text-gold text-[11px] font-semibold tracking-wide mb-2 shadow-xs">
              <Sparkles className="w-3 h-3 text-gold animate-gentle-pulse" />
              <span>{heroSubtitle || "Freshly Baked Daily • 100% Homemade"}</span>
            </div>

            <h1 className="mt-1 font-display font-semibold text-[2.1rem] leading-[1.12] text-ivory drop-shadow-md">
              {heroTitle || (<>
                Homemade Cakes
                <br />
                Crafted with{" "}
                <span className="relative inline-block text-blush">
                  Love
                  <svg aria-hidden="true" viewBox="0 0 200 20" className="absolute -bottom-1 left-0 w-full h-3 text-rose">
                    <path d="M2 15 Q 50 2, 100 12 T 198 10" stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" />
                  </svg>
                </span>
              </>)}
            </h1>
            <p className="mt-2.5 text-sm leading-relaxed text-ivory/85 line-clamp-2 drop-shadow-xs">
              {settings.description || 'Freshly baked cakes, brownies, chocolates and desserts made for every celebration.'}
            </p>

            {/* WhatsApp & Navigation CTAs */}
            <div className="mt-5 flex flex-col gap-2.5">
              <a
                href={waLink("Hi! I'd like to place an order with Cakes by Tulsi.")}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-rose text-ivory font-semibold text-sm py-3.5 shadow-lg shadow-cocoa/40 active:scale-[0.98] transition-transform duration-200"
              >
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
                Order on WhatsApp
              </a>

              {campaignCta ? (
                isInternalLink(campaignCta.ctaLink) ? (
                  <Link to={campaignCta.ctaLink} className="w-full inline-flex items-center justify-center gap-1.5 rounded-full border border-ivory/35 bg-ivory/15 backdrop-blur-md text-ivory font-semibold text-sm py-3.5 active:scale-[0.98] transition-transform duration-200">
                    {campaignCta.ctaText}
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                ) : (
                  <a href={campaignCta.ctaLink} target="_blank" rel="noopener noreferrer" className="w-full inline-flex items-center justify-center gap-1.5 rounded-full border border-ivory/35 bg-ivory/15 backdrop-blur-md text-ivory font-semibold text-sm py-3.5 active:scale-[0.98] transition-transform duration-200">
                    {campaignCta.ctaText}
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </a>
                )
              ) : (
                <Link to="/menu" className="w-full inline-flex items-center justify-center gap-1.5 rounded-full border border-ivory/35 bg-ivory/15 backdrop-blur-md text-ivory font-semibold text-sm py-3.5 active:scale-[0.98] transition-transform duration-200">
                  Explore Cakes
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              )}
            </div>
          </motion.div>

          {/* Carousel indicators */}
          {hasMultiple && (
            <div className="mt-5 flex items-center justify-center gap-1.5">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  aria-label={`Go to banner ${i + 1}`}
                  aria-current={i === current}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? "w-6 bg-gold shadow-xs" : "w-1.5 bg-ivory/45"}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 md:pt-24 md:pb-32 hidden md:grid md:grid-cols-2 gap-8 md:gap-10 items-center relative">
        {/* Text content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{
            transform: `translate3d(${mousePos.x * -4}px, ${mousePos.y * -3}px, 0)`,
          }}
          className="text-center sm:text-left"
        >
          <p className="font-script text-xl sm:text-2xl md:text-3xl text-rose-deep mb-1 sm:mb-2">
            {heroSubtitle || 'Freshly Baked Every Day'}
          </p>
          <h1 className="font-display font-semibold text-3xl sm:text-4xl md:text-4xl lg:text-5xl xl:text-6xl leading-[1.1] text-cocoa">
            {heroTitle || (<>
              Homemade Cakes
              <br />
              Crafted with{" "}
              <span className="relative inline-block text-rose-deep">
                Love
                <svg
                  aria-hidden="true"
                  viewBox="0 0 200 20"
                  className="absolute -bottom-1.5 left-0 w-full h-3.5 text-blush"
                >
                  <path d="M2 15 Q 50 2, 100 12 T 198 10" stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" />
                </svg>
              </span>
            </>)}
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mt-3 sm:mt-6 text-cocoa-soft/85 text-xs sm:text-base md:text-lg max-w-md mx-auto sm:mx-0 leading-relaxed"
          >
            {settings.description || 'Freshly baked cakes, brownies, chocolates and desserts made for every celebration.'}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-3 w-full max-w-xs sm:max-w-none mx-auto sm:mx-0"
          >
            {campaignCta ? (
              <AnimatedButton
                {...(isInternalLink(campaignCta.ctaLink)
                  ? { to: campaignCta.ctaLink }
                  : { href: campaignCta.ctaLink, target: "_blank", rel: "noopener noreferrer" })}
                className="w-full sm:w-auto justify-center"
                arrow
              >
                {campaignCta.ctaText}
              </AnimatedButton>
            ) : (
              <AnimatedButton to="/menu" variant="secondary" className="w-full sm:w-auto justify-center" arrow>
                Explore Cakes
              </AnimatedButton>
            )}
            <AnimatedButton
              href={waLink("Hi! I'd like to place an order with Cakes by Tulsi.")}
              target="_blank"
              rel="noopener noreferrer"
              variant={campaignCta ? "secondary" : "primary"}
              className="w-full sm:w-auto justify-center"
              arrow
            >
              Order on WhatsApp
            </AnimatedButton>
          </motion.div>
        </motion.div>

        {/* Hero image with parallax */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="relative mt-2 sm:mt-0 hidden md:block"
          style={{
            transform: `translate3d(${mousePos.x * 8}px, ${mousePos.y * 6}px, 0)`,
          }}
        >
          {/* Decorative shape behind image */}
          <div className="absolute -inset-2.5 sm:-inset-4 bg-gradient-to-br from-blush to-blush-soft/60 rounded-2xl sm:rounded-[3rem] -rotate-3 transition-transform duration-700" aria-hidden="true" />

          {/* Floating decorative elements */}
          <div className="absolute -top-6 -right-4 w-12 h-12 rounded-full bg-gold/20 animate-float hidden md:block" aria-hidden="true"
            style={{ transform: `translate3d(${mousePos.x * 14}px, ${mousePos.y * 10}px, 0)` }}
          />
          <div className="absolute -bottom-4 -left-6 w-8 h-8 rounded-full bg-rose/25 animate-float-slow hidden md:block" aria-hidden="true"
            style={{ transform: `translate3d(${mousePos.x * 18}px, ${mousePos.y * 12}px, 0)`, animationDelay: "1s" }}
          />

          {/* Premium decorative 3D-style cake accent */}
          <div className="absolute -bottom-4 -left-3 w-16 h-16 sm:-bottom-8 sm:-left-8 sm:w-28 sm:h-28 md:-bottom-10 md:-left-10 md:w-36 md:h-36 z-10">
            <HeroCakeAccent mousePos={mousePos} className="w-full h-full" />
          </div>

          {/* Main image with crossfade */}
          <div className="relative rounded-2xl sm:rounded-[3rem] overflow-hidden shadow-xl sm:shadow-2xl shadow-cocoa/10 aspect-[4/3] bg-cream-deep/20">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0"
              >
                <SafeImage
                  src={bannerImage || cinematicHeroDesktop}
                  fallback={cinematicHeroDesktop}
                  alt="Premium homemade cake"
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Carousel indicators */}
          {hasMultiple && (
            <div className="flex items-center justify-center gap-2 mt-4 sm:mt-5">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`carousel-dot ${i === current ? "active" : ""}`}
                  aria-label={`Go to banner ${i + 1}`}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}

/* ═══ TESTIMONIALS ═══ */
// Social proof block. Two jobs, not one: show the score/quotes, *and* recruit
// the next review — customers can now publish their own from /reviews, so
// every visit to this section is a chance to grow the proof it's built on.
function TestimonialsSection({ reviews, averageRating }) {
  const [current, setCurrent] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [visibleCount, setVisibleCount] = useState(1);
  const timerRef = useRef(null);
  const hasReviews = reviews.length > 0;

  // Track the breakpoint live rather than reading window.innerWidth once at
  // render — the old one-shot read never updated on resize/rotate, so a phone
  // turned landscape kept the 1-up layout for the rest of the session.
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const apply = () => setVisibleCount(mql.matches ? 3 : 1);
    apply();
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, []);

  const perView = Math.max(1, Math.min(visibleCount, reviews.length || 1));

  useEffect(() => {
    if (!autoPlay || reviews.length <= perView) return;
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % reviews.length);
    }, 5000);
    return () => clearInterval(timerRef.current);
  }, [autoPlay, reviews.length, perView]);

  const getVisible = () => {
    const result = [];
    for (let i = 0; i < perView; i++) {
      result.push(reviews[(current + i) % reviews.length]);
    }
    return result;
  };

  const next = () => {
    setCurrent((prev) => (prev + 1) % reviews.length);
    setAutoPlay(false);
  };
  const prev = () => {
    setCurrent((prev) => (prev - 1 + reviews.length) % reviews.length);
    setAutoPlay(false);
  };

  return (
    <section className="bg-blush-soft/50 py-10 sm:py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
        <ScrollReveal>
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-deep mb-2 sm:mb-3">Customer Reviews</p>
            <h2 className="font-display font-semibold text-2xl sm:text-3xl md:text-4xl text-cocoa">
              {hasReviews ? "What Our Customers Say" : "Be Our First Review"}
            </h2>
            {hasReviews ? (
              <div className="mt-4 sm:mt-5 inline-flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5 rounded-full border border-blush bg-ivory px-4 py-2 sm:px-5 sm:py-2.5 shadow-2xs">
                <span className="font-display font-semibold text-lg sm:text-xl text-cocoa tabular-nums">{averageRating.toFixed(1)}</span>
                <StarRatingDisplay value={averageRating} size="md" />
                <span className="text-xs sm:text-sm text-cocoa-soft/65">
                  from {reviews.length} review{reviews.length === 1 ? "" : "s"}
                </span>
              </div>
            ) : (
              <p className="mt-3 text-cocoa-soft/70 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
                Ordered from us already? Share how it went — your review helps the next customer decide.
              </p>
            )}
          </div>
        </ScrollReveal>

        {hasReviews && (
          <div className="relative mt-6 sm:mt-10">
            {reviews.length > perView && (
              <>
                <button
                  onClick={prev}
                  className="hidden sm:flex absolute -left-2 md:-left-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-ivory shadow-md border border-blush/50 items-center justify-center text-cocoa-soft hover:text-rose-deep transition-colors"
                  aria-label="Previous review"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={next}
                  className="hidden sm:flex absolute -right-2 md:-right-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-ivory shadow-md border border-blush/50 items-center justify-center text-cocoa-soft hover:text-rose-deep transition-colors"
                  aria-label="Next review"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5 px-1">
              <AnimatePresence mode="wait">
                {getVisible().map((r, i) => (
                  <motion.article
                    key={`${r.id}-${current}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.35, delay: i * 0.06 }}
                    className="bg-ivory rounded-2xl border border-blush/50 p-4 sm:p-6 relative flex flex-col shadow-2xs"
                  >
                    <Quote className="absolute top-4 right-4 sm:top-5 sm:right-5 w-6 h-6 sm:w-7 sm:h-7 text-blush/50" strokeWidth={1.5} aria-hidden="true" />
                    <StarRatingDisplay value={r.rating || 5} size="sm" />
                    <p className="mt-3 text-xs sm:text-sm text-cocoa-soft/85 leading-relaxed line-clamp-4 sm:line-clamp-5 flex-1">{r.review}</p>
                    <div className="flex items-center gap-2.5 sm:gap-3 mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-blush/40">
                      {r.photo ? (
                        <SafeImage
                          src={r.photo}
                          alt=""
                          containerClassName="w-9 h-9 sm:w-10 sm:h-10 shrink-0"
                          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-blush/50"
                        />
                      ) : (
                        <span
                          className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-full bg-blush-soft border border-blush/50 flex items-center justify-center font-display font-semibold text-rose-deep text-xs sm:text-sm"
                          aria-hidden="true"
                        >
                          {(r.name || "?").trim().charAt(0).toUpperCase()}
                        </span>
                      )}
                      <p className="font-semibold text-xs sm:text-sm text-cocoa truncate">{r.name}</p>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </div>

            {reviews.length > perView && (
              <div className="flex justify-center gap-1.5 mt-5 sm:mt-6">
                {reviews.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setCurrent(i); setAutoPlay(false); }}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === current ? "bg-rose w-5" : "bg-blush w-2 hover:bg-rose/50"
                    }`}
                    aria-label={`Go to review ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <ScrollReveal className="mt-6 sm:mt-10 flex flex-col sm:flex-row justify-center gap-2.5 sm:gap-3" delay={80}>
          {hasReviews && (
            <AnimatedButton to="/reviews" variant="secondary" arrow className="justify-center w-full sm:w-auto">
              Read All Reviews
            </AnimatedButton>
          )}
          <AnimatedButton to="/reviews" arrow className="justify-center w-full sm:w-auto">
            Write a Review
          </AnimatedButton>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ═══ SECTION TITLE ═══ */
function SectionTitle({ eyebrow, title, description }) {
  return (
    <div className="text-center">
      <p className="font-script text-2xl md:text-3xl text-rose-deep mb-1">{eyebrow}</p>
      <h2 className="font-display font-semibold text-2xl md:text-4xl text-cocoa">{title}</h2>
      {description && (
        <p className="mt-3 text-cocoa-soft/70 max-w-md mx-auto leading-relaxed">{description}</p>
      )}
    </div>
  );
}
