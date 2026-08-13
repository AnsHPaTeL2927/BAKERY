import { useEffect, useState, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Images } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "../components/PageHeader";
import { getGallery, trackEvent } from "../services/api";
import SafeImage from "../components/SafeImage";
import Skeleton from "../components/loading/Skeleton";
import ScrollReveal from "../components/ScrollReveal";

const SKELETON_HEIGHTS = ["h-40", "h-56", "h-64", "h-48", "h-52", "h-36", "h-60", "h-44"];

export default function Gallery() {
  const [active, setActive] = useState("All");
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGallery()
      .then(setGalleryImages)
      .finally(() => setLoading(false));
    trackEvent("GALLERY_VIEW");
  }, []);

  const galleryCategories = Array.from(new Set(galleryImages.map((g) => g.category).filter(Boolean)));
  const filtered = active === "All" ? galleryImages : galleryImages.filter((g) => g.category === active);

  function openLightbox(id) {
    setLightboxIndex(filtered.findIndex((g) => g.id === id));
  }

  const close = useCallback(() => setLightboxIndex(null), []);
  const next = useCallback((e) => {
    if (e) e.stopPropagation();
    setLightboxIndex((i) => (i + 1) % filtered.length);
  }, [filtered.length]);
  const prev = useCallback((e) => {
    if (e) e.stopPropagation();
    setLightboxIndex((i) => (i - 1 + filtered.length) % filtered.length);
  }, [filtered.length]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;
    function handleKey(e) {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [lightboxIndex, close, next, prev]);

  // Touch/swipe for lightbox
  const [touchStart, setTouchStart] = useState(0);
  const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
    }
  };

  return (
    <>
      <PageHeader eyebrow="A Peek Inside" title="Gallery" description="Real cakes, real celebrations, real customers." />

      <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-10 md:py-14">
        {!loading && galleryCategories.length > 0 && (
          <ScrollReveal className="mb-6 sm:mb-10">
            <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide sm:flex-wrap sm:justify-center -mx-4 px-4 sm:mx-0 sm:px-0">
              {["All", ...galleryCategories].map((c) => (
                <button
                  key={c}
                  onClick={() => setActive(c)}
                  className={`shrink-0 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold border transition-all duration-200 ${
                    active === c
                      ? "bg-rose text-ivory border-rose shadow-2xs"
                      : "border-blush text-cocoa-soft hover:border-rose/60 hover:text-rose-deep bg-ivory/80"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </ScrollReveal>
        )}

        {loading && (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-2.5 space-y-2.5 sm:gap-4 sm:space-y-4">
            {SKELETON_HEIGHTS.map((h, i) => (
              <Skeleton key={i} className={`w-full break-inside-avoid rounded-xl sm:rounded-2xl ${h}`} />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 sm:py-20">
            <Images className="w-9 h-9 sm:w-10 sm:h-10 text-rose/40 mx-auto mb-3" strokeWidth={1.5} aria-hidden="true" />
            <p className="text-cocoa-soft/70 text-base sm:text-lg">No gallery images yet — check back soon!</p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-2.5 space-y-2.5 sm:gap-4 sm:space-y-4">
            {filtered.map((g, i) => (
              <ScrollReveal key={g.id} delay={i * 30} distance={12} className="break-inside-avoid">
                <button
                  onClick={() => openLightbox(g.id)}
                  className="block w-full rounded-xl sm:rounded-2xl overflow-hidden focus-visible:outline-2 focus-visible:outline-rose img-zoom-container group shadow-2xs"
                >
                  <SafeImage
                    src={g.image}
                    alt={g.alt}
                    loading="lazy"
                    blurLoad
                    showSkeleton
                    containerClassName="w-full bg-cream-deep/20"
                    className="w-full object-cover img-zoom-target"
                  />
                  <div className="absolute inset-0 bg-cocoa/0 group-hover:bg-cocoa/15 transition-colors duration-300 rounded-xl sm:rounded-2xl" />
                </button>
              </ScrollReveal>
            ))}
          </div>
        )}
      </section>

      {/* ═══ LIGHTBOX ═══ */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 bg-cocoa/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
            onClick={close}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            role="dialog"
            aria-modal="true"
          >
            <button
              onClick={close}
              className="absolute top-4 right-4 z-20 text-cream p-2 rounded-full bg-cocoa/60 backdrop-blur-md border border-cream/20 hover:bg-rose transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              onClick={prev}
              className="absolute left-2 sm:left-6 z-20 text-cream p-2 rounded-full bg-cocoa/60 backdrop-blur-md border border-cream/20 hover:bg-rose transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>

            <AnimatePresence mode="wait">
              <motion.div
                key={lightboxIndex}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                onClick={(e) => e.stopPropagation()}
                className="max-h-[80vh] max-w-[92vw] flex items-center justify-center"
              >
                <SafeImage
                  src={filtered[lightboxIndex]?.image}
                  alt={filtered[lightboxIndex]?.alt}
                  className="max-h-[80vh] max-w-[92vw] rounded-2xl object-contain shadow-2xl"
                />
              </motion.div>
            </AnimatePresence>

            <button
              onClick={next}
              className="absolute right-2 sm:right-6 z-20 text-cream p-2 rounded-full bg-cocoa/60 backdrop-blur-md border border-cream/20 hover:bg-rose transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>

            {/* Image counter */}
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-cream/70 text-xs sm:text-sm font-semibold bg-cocoa/60 backdrop-blur-md px-3 py-1 rounded-full border border-cream/10">
              {lightboxIndex + 1} / {filtered.length}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
