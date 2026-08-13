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

      <section className="max-w-6xl mx-auto px-5 md:px-8 py-10 md:py-14">
        {!loading && galleryCategories.length > 0 && (
          <ScrollReveal className="flex flex-wrap gap-2 justify-center mb-10">
            {["All", ...galleryCategories].map((c) => (
              <button
                key={c}
                onClick={() => setActive(c)}
                className={`px-4 py-2 rounded-full text-xs md:text-sm font-semibold border transition-all duration-300 ${
                  active === c
                    ? "bg-rose text-ivory border-rose shadow-sm shadow-rose/20"
                    : "border-blush text-cocoa-soft hover:border-rose/60 hover:text-rose-deep"
                }`}
              >
                {c}
              </button>
            ))}
          </ScrollReveal>
        )}

        {loading && (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {SKELETON_HEIGHTS.map((h, i) => (
              <Skeleton key={i} className={`w-full break-inside-avoid rounded-2xl ${h}`} />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-20">
            <Images className="w-10 h-10 text-rose/40 mx-auto mb-4" strokeWidth={1.5} aria-hidden="true" />
            <p className="text-cocoa-soft/70 text-lg">No gallery images yet — check back soon!</p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {filtered.map((g, i) => (
              <ScrollReveal key={g.id} delay={i * 40} distance={16} className="break-inside-avoid">
                <button
                  onClick={() => openLightbox(g.id)}
                  className="block w-full rounded-2xl overflow-hidden focus-visible:outline-2 focus-visible:outline-rose img-zoom-container group"
                >
                  <SafeImage
                    src={g.image}
                    alt={g.alt}
                    loading="lazy"
                    blurLoad
                    showSkeleton
                    containerClassName="w-full"
                    className="w-full object-cover img-zoom-target"
                  />
                  <div className="absolute inset-0 bg-cocoa/0 group-hover:bg-cocoa/10 transition-colors duration-400 rounded-2xl" />
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
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 lightbox-backdrop flex items-center justify-center p-4"
            onClick={close}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            role="dialog"
            aria-modal="true"
          >
            <button onClick={close} className="absolute top-5 right-5 text-ivory p-2 hover:bg-ivory/10 rounded-full transition-colors" aria-label="Close">
              <X className="w-7 h-7" />
            </button>
            <button
              onClick={prev}
              className="absolute left-3 md:left-8 text-ivory p-2 hover:bg-ivory/10 rounded-full transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>

            <AnimatePresence mode="wait">
              <motion.div
                key={lightboxIndex}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                onClick={(e) => e.stopPropagation()}
              >
                <SafeImage
                  src={filtered[lightboxIndex]?.image}
                  alt={filtered[lightboxIndex]?.alt}
                  className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
                />
              </motion.div>
            </AnimatePresence>

            <button
              onClick={next}
              className="absolute right-3 md:right-8 text-ivory p-2 hover:bg-ivory/10 rounded-full transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="w-8 h-8" />
            </button>

            {/* Image counter */}
            <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-ivory/60 text-sm font-medium">
              {lightboxIndex + 1} / {filtered.length}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
