import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Sparkles, Heart, Leaf, ChefHat, ShieldCheck, Clock, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { getPublicContent } from "../services/api";
import IcingDivider from "../components/IcingDivider";
import ProductCard from "../components/ProductCard";
import SafeImage from "../components/SafeImage";
import Skeleton from "../components/loading/Skeleton";
import CardSkeleton from "../components/loading/CardSkeleton";
import ScrollReveal from "../components/ScrollReveal";
import ParallaxLayer from "../components/ParallaxLayer";
import AnimatedButton from "../components/AnimatedButton";
import heroDefault from "../assets/hero-default.svg";
import customCakeDefault from "../assets/custom-cake-default.svg";

const icons = [Heart, Leaf, Sparkles, ChefHat, Star, Clock, ShieldCheck];

/* ─── Storytelling steps ─────────────────────────────────────────── */
const storySteps = [
  { title: "Finest Ingredients", desc: "Hand-picked butter, Belgian chocolate, seasonal fruit.", icon: "🧈" },
  { title: "Crafted by Hand", desc: "Every layer mixed, folded and shaped with care.", icon: "🤲" },
  { title: "Baked with Love", desc: "Slow-baked in small batches, never mass-produced.", icon: "🔥" },
  { title: "Beautifully Finished", desc: "Decorated with precision, piped by hand.", icon: "🎂" },
  { title: "Ready to Celebrate", desc: "Delivered fresh to your door for every occasion.", icon: "🎉" },
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
  const activeOffer = festivalOffers.find((o) => o.active);
  const bestSellers = products.filter((p) => p.featured).slice(0, 6);
  const waLink = (message) => `https://wa.me/${settings.whatsapp || '918780652597'}?text=${encodeURIComponent(message)}`;

  return (
    <>
      {/* ═══ HERO ═══ */}
      <HeroSection
        banners={liveHeroBanners}
        settings={settings}
        waLink={waLink}
        loading={loading}
      />

      <IcingDivider className="text-blush" />

      {/* ═══ FESTIVAL OFFER BANNER ═══ */}
      {activeOffer && (
        <ScrollReveal className="max-w-6xl mx-auto px-5 md:px-8 py-14">
          <div className="relative rounded-[2rem] overflow-hidden bg-rose-deep text-ivory grid md:grid-cols-2 items-center group">
            <div className="p-8 md:p-12 relative z-10">
              <p className="font-script text-3xl text-blush mb-1">{activeOffer.festival}</p>
              <h2 className="font-display font-semibold text-2xl md:text-4xl">{activeOffer.title}</h2>
              <p className="mt-3 text-ivory/85 max-w-sm">{activeOffer.description}</p>
              <div className="mt-5 inline-flex items-center gap-2 bg-gold text-cocoa font-bold px-4 py-1.5 rounded-full text-sm badge-float">
                {activeOffer.discount}
              </div>
              <div className="mt-6">
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
            <div className="h-56 md:h-full img-zoom-container">
              <SafeImage src={activeOffer.banner} alt="" className="w-full h-full object-cover opacity-90 img-zoom-target" />
            </div>
          </div>
        </ScrollReveal>
      )}

      {/* ═══ CATEGORIES ═══ */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 py-8 md:py-16">
        <ScrollReveal>
          <SectionTitle eyebrow="What We Bake" title="Explore Our Categories" />
        </ScrollReveal>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-10">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-blush/60 bg-ivory p-4 text-center">
                  <Skeleton className="mb-3 aspect-square w-full rounded-xl" />
                  <Skeleton className="mx-auto h-3 w-2/3" />
                </div>
              ))
            : categories.map((c, i) => (
                <ScrollReveal key={c.slug || c.id} delay={i * 60} distance={20}>
                  <Link
                    to={`/menu?category=${c.slug || c.id}`}
                    className="group bg-ivory rounded-2xl border border-blush/50 p-4 text-center card-hover block"
                  >
                    <div className="w-full aspect-square rounded-xl img-zoom-container mb-3 relative overflow-hidden">
                      <SafeImage
                        src={c.image}
                        alt={c.name}
                        loading="lazy"
                        blurLoad
                        showSkeleton
                        containerClassName="w-full h-full"
                        className="w-full h-full object-cover img-zoom-target"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-cocoa/15 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
                    </div>
                    <p className="font-display font-semibold text-cocoa text-sm">{c.name}</p>
                  </Link>
                </ScrollReveal>
              ))}
        </div>
      </section>

      {/* ═══ BEST SELLERS ═══ */}
      <section className="bg-blush-soft/50 py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-5 md:px-8">
          <ScrollReveal>
            <SectionTitle eyebrow="Customer Favourites" title="Best Sellers" />
          </ScrollReveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
              : bestSellers.map((p, i) => (
                  <ScrollReveal key={p.id} delay={i * 80}>
                    <ProductCard product={p} />
                  </ScrollReveal>
                ))}
          </div>
          {!loading && bestSellers.length > 0 && (
            <ScrollReveal className="text-center mt-10">
              <AnimatedButton to="/menu" variant="secondary" arrow>
                View Full Menu
              </AnimatedButton>
            </ScrollReveal>
          )}
        </div>
      </section>

      {/* ═══ WHY CHOOSE US ═══ */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 py-16 md:py-24">
        <ScrollReveal>
          <SectionTitle eyebrow="The Tulsi Difference" title="Why Choose Us" />
        </ScrollReveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
          {whyChooseUs.map((item, i) => {
            const Icon = icons[i % icons.length];
            return (
              <ScrollReveal key={item.title} delay={i * 60} distance={20}>
                <div className="bg-ivory rounded-2xl border border-blush/50 p-6 text-center card-hover h-full">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blush to-blush-soft flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-rose-deep" />
                  </div>
                  <p className="font-display font-semibold text-cocoa mb-1">{item.title}</p>
                  <p className="text-sm text-cocoa-soft/70 leading-relaxed">{item.detail}</p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      {/* ═══ STORYTELLING ═══ */}
      <section className="relative bg-cocoa text-cream overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-rose blur-3xl" />
          <div className="absolute bottom-10 right-10 w-56 h-56 rounded-full bg-gold blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-5 md:px-8 py-20 md:py-32">
          <ScrollReveal>
            <div className="text-center mb-16">
              <p className="font-script text-3xl text-blush mb-2">Our Process</p>
              <h2 className="font-display font-semibold text-2xl md:text-4xl text-cream">From Kitchen to Celebration</h2>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-4">
            {storySteps.map((step, i) => (
              <ScrollReveal key={step.title} delay={i * 100} distance={24}>
                <div className="text-center group">
                  <div className="text-4xl md:text-5xl mb-4 transition-transform duration-500 group-hover:scale-110">
                    {step.icon}
                  </div>
                  <p className="font-display font-semibold text-cream text-sm md:text-base mb-1">{step.title}</p>
                  <p className="text-cream/60 text-xs md:text-sm leading-relaxed">{step.desc}</p>
                  {i < storySteps.length - 1 && (
                    <div className="hidden md:block mt-4 mx-auto w-8 h-[2px] bg-cream/20 rounded-full" />
                  )}
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CUSTOM CAKE BANNER ═══ */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 py-16 md:py-24">
        <ScrollReveal>
          <div className="relative rounded-[2rem] overflow-hidden bg-cocoa text-cream grid md:grid-cols-2 items-center">
            <ParallaxLayer speed={0.05} className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-rose/10 blur-3xl" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-gold/10 blur-2xl" />
            </ParallaxLayer>
            <div className="p-8 md:p-12 relative z-10">
              <p className="font-script text-3xl text-blush mb-1">Made Just for You</p>
              <h2 className="font-display font-semibold text-2xl md:text-4xl">Custom Cakes for Every Occasion</h2>
              <p className="mt-3 text-cream/70 max-w-sm leading-relaxed">
                Birthdays, anniversaries, weddings, baby showers, corporate events — tell us your vision and we'll bake it.
              </p>
              <div className="mt-6">
                <AnimatedButton to="/custom-cake" arrow>
                  Request Custom Cake
                </AnimatedButton>
              </div>
            </div>
            <div className="h-56 md:h-full img-zoom-container">
              <SafeImage
                src={customCakeDefault}
                fallback={customCakeDefault}
                alt="Custom tiered celebration cake"
                className="w-full h-full object-cover opacity-85 img-zoom-target"
              />
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ═══ GALLERY PREVIEW ═══ */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 pb-16 md:pb-24">
        <ScrollReveal>
          <SectionTitle eyebrow="A Peek Inside" title="Gallery" />
        </ScrollReveal>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-2xl" />)
            : galleryImages.slice(0, 8).map((g, i) => (
                <ScrollReveal key={g.id} delay={i * 50} distance={16}>
                  <div className="rounded-2xl overflow-hidden aspect-square img-zoom-container">
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
          <ScrollReveal className="text-center mt-10">
            <AnimatedButton to="/gallery" variant="secondary" arrow>
              View Full Gallery
            </AnimatedButton>
          </ScrollReveal>
        )}
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      {!loading && reviews.filter((r) => r.approved !== false).length > 0 && (
        <TestimonialsSection reviews={reviews.filter((r) => r.approved !== false)} />
      )}

      {/* ═══ FINAL CTA ═══ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blush-soft via-cream to-blush-soft/50" />
        <ParallaxLayer speed={0.08} className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 right-1/4 text-6xl opacity-10 animate-float-slow">🎂</div>
          <div className="absolute bottom-1/3 left-1/6 text-5xl opacity-10 animate-float" style={{ animationDelay: "1s" }}>🧁</div>
          <div className="absolute top-1/3 left-1/3 text-4xl opacity-10 animate-float-slow" style={{ animationDelay: "2s" }}>✨</div>
        </ParallaxLayer>
        <div className="relative max-w-6xl mx-auto px-5 md:px-8 py-20 md:py-32 text-center">
          <ScrollReveal>
            <p className="font-script text-3xl md:text-4xl text-rose-deep mb-3">Ready to Order?</p>
            <h2 className="font-display font-semibold text-3xl md:text-5xl text-cocoa max-w-2xl mx-auto leading-tight">
              Make Every Celebration Sweeter
            </h2>
            <p className="mt-4 text-cocoa-soft/70 max-w-md mx-auto text-lg">
              Message us on WhatsApp and let's plan your next celebration.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <AnimatedButton
                href={waLink("Hi! I'd like to place an order with Cakes by Tulsi.")}
                target="_blank"
                rel="noopener noreferrer"
                size="lg"
                arrow
              >
                Order Your Cake
              </AnimatedButton>
              <AnimatedButton to="/custom-cake" variant="secondary" size="lg" arrow>
                Create Custom Cake
              </AnimatedButton>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}

/* ═══ HERO SECTION ═══ */
function HeroSection({ banners, settings, waLink, loading }) {
  const [current, setCurrent] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const heroRef = useRef(null);
  const autoPlayRef = useRef(null);
  const touchRef = useRef({ startX: 0 });

  const hasBanners = banners.length > 0;
  const hasMultiple = banners.length > 1;
  const heroImage = hasBanners ? banners[current]?.image : heroDefault;
  const heroTitle = banners[current]?.title;
  const heroSubtitle = banners[current]?.subtitle;

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

  // Mouse parallax (desktop only)
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) return;
    const handler = (e) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      setMousePos({ x, y });
    };
    const el = heroRef.current;
    if (el) el.addEventListener("mousemove", handler);
    return () => { if (el) el.removeEventListener("mousemove", handler); };
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
      className="relative overflow-hidden bg-cream"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-blush/30 blur-3xl animate-gentle-pulse" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-rose/10 blur-3xl" style={{ animationDelay: "1.5s" }} />
      </div>

      <div className="max-w-6xl mx-auto px-5 md:px-8 pt-16 pb-20 md:pt-24 md:pb-32 grid md:grid-cols-2 gap-10 items-center relative">
        {/* Text content */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{
            transform: `translate3d(${mousePos.x * -4}px, ${mousePos.y * -3}px, 0)`,
          }}
        >
          <p className="font-script text-2xl md:text-3xl text-rose-deep mb-2">
            {heroSubtitle || 'Freshly Baked Every Day'}
          </p>
          <h1 className="font-display font-semibold text-4xl md:text-6xl leading-[1.05] text-cocoa">
            {heroTitle || (<>
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
            </>)}
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-6 text-cocoa-soft/85 text-lg max-w-md leading-relaxed"
          >
            {settings.description || 'Freshly baked cakes, brownies, chocolates and desserts made for every celebration.'}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-8 flex flex-wrap gap-4"
          >
            <AnimatedButton
              href={waLink("Hi! I'd like to place an order with Cakes by Tulsi.")}
              target="_blank"
              rel="noopener noreferrer"
              arrow
            >
              Order on WhatsApp
            </AnimatedButton>
            <AnimatedButton to="/menu" variant="secondary" arrow>
              View Menu
            </AnimatedButton>
          </motion.div>
        </motion.div>

        {/* Hero image with parallax */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="relative"
          style={{
            transform: `translate3d(${mousePos.x * 8}px, ${mousePos.y * 6}px, 0)`,
          }}
        >
          {/* Decorative shape behind image */}
          <div className="absolute -inset-4 bg-gradient-to-br from-blush to-blush-soft/60 rounded-[3rem] -rotate-3 transition-transform duration-700" aria-hidden="true" />

          {/* Floating decorative elements */}
          <div className="absolute -top-6 -right-4 w-12 h-12 rounded-full bg-gold/20 animate-float hidden md:block" aria-hidden="true"
            style={{ transform: `translate3d(${mousePos.x * 14}px, ${mousePos.y * 10}px, 0)` }}
          />
          <div className="absolute -bottom-4 -left-6 w-8 h-8 rounded-full bg-rose/25 animate-float-slow hidden md:block" aria-hidden="true"
            style={{ transform: `translate3d(${mousePos.x * 18}px, ${mousePos.y * 12}px, 0)`, animationDelay: "1s" }}
          />

          {/* Main image with crossfade */}
          <div className="relative rounded-[3rem] overflow-hidden shadow-2xl shadow-cocoa/10 aspect-[4/3]">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0"
              >
                <SafeImage
                  src={heroImage || heroDefault}
                  fallback={heroDefault}
                  alt="Premium homemade cake"
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Carousel indicators */}
          {hasMultiple && (
            <div className="flex items-center justify-center gap-2 mt-5">
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

/* ═══ TESTIMONIALS CAROUSEL ═══ */
function TestimonialsSection({ reviews }) {
  const [current, setCurrent] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const timerRef = useRef(null);

  // Show 1 on mobile, up to 3 on desktop, but adapt to available reviews
  const visibleCount = typeof window !== 'undefined' && window.innerWidth < 768 ? 1 : Math.min(reviews.length, 3);

  useEffect(() => {
    if (!autoPlay || reviews.length <= visibleCount) return;
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % reviews.length);
    }, 4000);
    return () => clearInterval(timerRef.current);
  }, [autoPlay, reviews.length, visibleCount]);

  const getVisible = () => {
    const result = [];
    for (let i = 0; i < visibleCount; i++) {
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
    <section className="bg-blush-soft/50 py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-5 md:px-8">
        <ScrollReveal>
          <SectionTitle eyebrow="Kind Words" title="What Our Customers Say" />
        </ScrollReveal>

        <div className="relative mt-10">
          {reviews.length > visibleCount && (
            <>
              <button
                onClick={prev}
                className="absolute -left-2 md:-left-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-ivory shadow-md border border-blush/50 flex items-center justify-center text-cocoa-soft hover:text-rose-deep transition-colors"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={next}
                className="absolute -right-2 md:-right-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-ivory shadow-md border border-blush/50 flex items-center justify-center text-cocoa-soft hover:text-rose-deep transition-colors"
                aria-label="Next testimonial"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 overflow-hidden px-2">
            <AnimatePresence mode="wait">
              {getVisible().map((r, i) => (
                <motion.div
                  key={`${r.id}-${current}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="bg-ivory rounded-2xl border border-blush/50 p-6 relative"
                >
                  <Quote className="absolute top-4 right-4 w-8 h-8 text-blush/40" />
                  <div className="flex gap-1 text-gold mb-3">
                    {Array.from({ length: r.rating || 5 }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-gold" />
                    ))}
                  </div>
                  <p className="text-sm text-cocoa-soft/85 leading-relaxed line-clamp-4">"{r.review}"</p>
                  <div className="flex items-center gap-3 mt-4">
                    <SafeImage src={r.photo} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-blush/40" />
                    <p className="font-semibold text-sm text-cocoa">{r.name}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Dots */}
          {reviews.length > visibleCount && (
            <div className="flex justify-center gap-1.5 mt-6">
              {reviews.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setCurrent(i); setAutoPlay(false); }}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i === current ? "bg-rose w-5" : "bg-blush hover:bg-rose/50"
                  }`}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ═══ SECTION TITLE ═══ */
function SectionTitle({ eyebrow, title }) {
  return (
    <div className="text-center">
      <p className="font-script text-2xl md:text-3xl text-rose-deep mb-1">{eyebrow}</p>
      <h2 className="font-display font-semibold text-2xl md:text-4xl text-cocoa">{title}</h2>
    </div>
  );
}
