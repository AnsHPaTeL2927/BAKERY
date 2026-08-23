import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CakeSlice, Search, X, LayoutGrid, List } from "lucide-react";
import PageHeader from "../components/PageHeader";
import ProductCard from "../components/ProductCard";
import CardSkeleton from "../components/loading/CardSkeleton";
import ScrollReveal from "../components/ScrollReveal";
import { getPublicContent } from "../services/api";

export default function Menu() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";
  const [active, setActive] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' (2-col on mobile) or 'list' (horizontal row)
  const [content, setContent] = useState({ categories: [], products: [], settings: {} });
  const [loading, setLoading] = useState(true);
  const navContainerRef = useRef(null);
  const menuSectionRef = useRef(null);

  useEffect(() => {
    getPublicContent()
      .then(setContent)
      .finally(() => setLoading(false));
  }, []);

  const categories = content.categories || [];
  const products = content.products || [];
  const whatsapp = content.settings?.whatsapp;

  useEffect(() => {
    setActive(searchParams.get("category") || "all");
  }, [searchParams]);

  // Compute product count per category for quick badges
  const categoryCounts = useMemo(() => {
    const counts = { all: products.length };
    products.forEach((p) => {
      if (p.category) {
        counts[p.category] = (counts[p.category] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  // Combined filtering: category + search query
  const filtered = useMemo(() => {
    let result = active === "all" ? products : products.filter((p) => p.category === active);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.flavours && p.flavours.some((f) => f.toLowerCase().includes(q)))
      );
    }
    return result;
  }, [active, products, searchQuery]);

  function selectCategory(slug, targetBtnElement) {
    setActive(slug);
    if (slug === "all") {
      searchParams.delete("category");
      setSearchParams(searchParams);
    } else {
      setSearchParams({ category: slug });
    }
    // Scroll active pill into view on mobile sticky category bar
    if (targetBtnElement && targetBtnElement.scrollIntoView) {
      targetBtnElement.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
    // Auto-scroll window to start of category products menu
    if (menuSectionRef.current) {
      const yOffset = -125; // Offset for navbar and sticky category bar
      const y = menuSectionRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Our Menu"
        title="Every Bake, One Place"
        description="Cakes, brownies, cupcakes, muffins, chocolates and cookies — all made fresh to order."
      />

      {/* STICKY MOBILE-FIRST CATEGORY BAR */}
      <div className="sticky top-[64px] sm:top-[72px] z-30 bg-cream/95 backdrop-blur-md border-b border-blush/40 py-2.5 px-4 shadow-2xs transition-all duration-300">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          {/* Horizontally scrollable category pills */}
          <div
            ref={navContainerRef}
            className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-0.5 min-w-0 flex-1 scroll-smooth"
          >
            <button
              type="button"
              onClick={(e) => selectCategory("all", e.currentTarget)}
              className={`shrink-0 px-4 py-1.5 sm:px-5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold border transition-all duration-300 flex items-center gap-1.5 ${
                active === "all"
                  ? "bg-rose text-ivory border-rose shadow-sm shadow-rose/20"
                  : "bg-ivory/80 border-blush text-cocoa-soft hover:border-rose/60 hover:text-rose-deep"
              }`}
            >
              <span>All</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${active === "all" ? "bg-ivory/20 text-ivory" : "bg-blush/60 text-cocoa-soft"}`}>
                {categoryCounts.all || 0}
              </span>
            </button>
            {categories.map((c) => {
              const slug = c.slug || c.id;
              const isSelected = active === slug;
              const count = categoryCounts[slug] || 0;
              return (
                <button
                  key={slug}
                  type="button"
                  onClick={(e) => selectCategory(slug, e.currentTarget)}
                  className={`shrink-0 px-4 py-1.5 sm:px-5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold border transition-all duration-300 flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-rose text-ivory border-rose shadow-sm shadow-rose/20"
                      : "bg-ivory/80 border-blush text-cocoa-soft hover:border-rose/60 hover:text-rose-deep"
                  }`}
                >
                  <span>{c.name}</span>
                  {count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isSelected ? "bg-ivory/20 text-ivory" : "bg-blush/60 text-cocoa-soft"}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <section ref={menuSectionRef} className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-12">
        {/* MOBILE SEARCH & TOOLBAR BAR */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 sm:mb-10 bg-ivory/90 border border-blush/60 p-3 sm:p-4 rounded-2xl sm:rounded-3xl shadow-2xs">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cocoa-soft/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cakes, brownies, cookies…"
              className="w-full pl-10 pr-9 py-2 sm:py-2.5 bg-cream/50 border border-blush/60 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-cocoa placeholder:text-cocoa-soft/50 focus:outline-none focus:border-rose focus:ring-2 focus:ring-rose/15 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-cocoa-soft/60 hover:text-cocoa"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Results Summary & View Switcher */}
          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
            <span className="text-xs font-semibold text-cocoa-soft/80">
              {filtered.length} {filtered.length === 1 ? "item" : "items"}
            </span>

            {/* Layout Toggle (Grid 2-col vs List view) */}
            <div className="flex items-center gap-1 bg-cream-deep/40 p-1 rounded-xl border border-blush/40">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === "grid"
                    ? "bg-rose text-ivory shadow-xs"
                    : "text-cocoa-soft hover:text-cocoa"
                }`}
                title="2-Column Grid View"
                aria-label="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === "list"
                    ? "bg-rose text-ivory shadow-xs"
                    : "text-cocoa-soft hover:text-cocoa"
                }`}
                title="Compact List View"
                aria-label="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* PRODUCTS SECTION */}
        {loading ? (
          <div className={viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-6" : "flex flex-col gap-3.5"}>
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${active}-${viewMode}-${searchQuery}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className={
                viewMode === "grid"
                  ? "grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6"
                  : "flex flex-col gap-3.5 sm:gap-5"
              }
            >
              {filtered.map((p, i) => (
                <ScrollReveal key={p.id} delay={i * 40} distance={12}>
                  <ProductCard product={p} whatsapp={whatsapp} viewMode={viewMode} />
                </ScrollReveal>
              ))}
            </motion.div>
          </AnimatePresence>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 px-4 bg-ivory/60 rounded-3xl border border-blush/40 max-w-md mx-auto my-8 shadow-xs"
          >
            <div className="w-14 h-14 rounded-full bg-blush-soft flex items-center justify-center mx-auto mb-4 text-rose">
              <CakeSlice className="w-7 h-7" strokeWidth={1.5} />
            </div>
            <h3 className="font-display font-semibold text-lg text-cocoa mb-1">No items found</h3>
            <p className="text-cocoa-soft/75 text-xs sm:text-sm mb-5 leading-relaxed">
              {searchQuery
                ? `No products matched "${searchQuery}". Try searching for another term or reset your search.`
                : "Nothing in this category yet — check back soon or send us a WhatsApp message for custom orders."}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="px-5 py-2.5 bg-rose text-ivory text-xs font-semibold rounded-full hover:bg-rose-deep transition-all shadow-sm"
              >
                Clear Search
              </button>
            )}
          </motion.div>
        )}
      </section>
    </>
  );
}
