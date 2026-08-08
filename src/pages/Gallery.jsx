import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { getGallery, trackEvent } from "../services/api";
import SafeImage from "../components/SafeImage";
import Skeleton from "../components/loading/Skeleton";

// Cycled heights give the loading skeleton the same masonry rhythm as the
// real grid, instead of a plain uniform block grid that doesn't match.
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
  function close() {
    setLightboxIndex(null);
  }
  function next(e) {
    e.stopPropagation();
    setLightboxIndex((i) => (i + 1) % filtered.length);
  }
  function prev(e) {
    e.stopPropagation();
    setLightboxIndex((i) => (i - 1 + filtered.length) % filtered.length);
  }

  return (
    <>
      <PageHeader eyebrow="A Peek Inside" title="Gallery" description="Real cakes, real celebrations, real customers." />

      <section className="max-w-6xl mx-auto px-5 md:px-8 py-10 md:py-14">
        {!loading && (
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {["All", ...galleryCategories].map((c) => (
              <button
                key={c}
                onClick={() => setActive(c)}
                className={`px-4 py-2 rounded-full text-xs md:text-sm font-semibold border transition-colors ${
                  active === c ? "bg-rose text-ivory border-rose" : "border-blush text-cocoa-soft hover:border-rose"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {SKELETON_HEIGHTS.map((h, i) => (
              <Skeleton key={i} className={`w-full break-inside-avoid rounded-2xl ${h}`} />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <p className="text-center text-cocoa-soft/70 py-14">No gallery images yet — check back soon!</p>
        )}

        {!loading && filtered.length > 0 && (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {filtered.map((g) => (
            <button
              key={g.id}
              onClick={() => openLightbox(g.id)}
              className="block w-full break-inside-avoid rounded-2xl overflow-hidden focus-visible:outline-2 focus-visible:outline-rose"
            >
              <SafeImage src={g.image} alt={g.alt} loading="lazy" className="w-full object-cover hover:scale-105 transition-transform duration-500" />
            </button>
          ))}
        </div>
        )}
      </section>

      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-cocoa/95 flex items-center justify-center p-4"
          onClick={close}
          role="dialog"
          aria-modal="true"
        >
          <button onClick={close} className="absolute top-5 right-5 text-ivory p-2" aria-label="Close">
            <X className="w-7 h-7" />
          </button>
          <button onClick={prev} className="absolute left-3 md:left-8 text-ivory p-2" aria-label="Previous image">
            <ChevronLeft className="w-8 h-8" />
          </button>
          <SafeImage
            src={filtered[lightboxIndex].image}
            alt={filtered[lightboxIndex].alt}
            className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button onClick={next} className="absolute right-3 md:right-8 text-ivory p-2" aria-label="Next image">
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>
      )}
    </>
  );
}
