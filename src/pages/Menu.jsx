import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CakeSlice } from "lucide-react";
import PageHeader from "../components/PageHeader";
import ProductCard from "../components/ProductCard";
import CardSkeleton from "../components/loading/CardSkeleton";
import ScrollReveal from "../components/ScrollReveal";
import { getPublicContent } from "../services/api";

export default function Menu() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";
  const [active, setActive] = useState(initialCategory);
  const [content, setContent] = useState({ categories: [], products: [], settings: {} });
  const [loading, setLoading] = useState(true);

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

  const filtered = useMemo(
    () => (active === "all" ? products : products.filter((p) => p.category === active)),
    [active, products]
  );

  function selectCategory(slug) {
    setActive(slug);
    if (slug === "all") {
      searchParams.delete("category");
      setSearchParams(searchParams);
    } else {
      setSearchParams({ category: slug });
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Our Menu"
        title="Every Bake, One Place"
        description="Cakes, brownies, cupcakes, muffins, chocolates and cookies — all made fresh to order."
      />

      <section className="max-w-6xl mx-auto px-5 md:px-8 py-10 md:py-16">
        {/* Category filter pills */}
        <ScrollReveal className="flex flex-wrap gap-2 justify-center mb-10">
          <button
            onClick={() => selectCategory("all")}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold border transition-all duration-300 ${
              active === "all"
                ? "bg-rose text-ivory border-rose shadow-sm shadow-rose/20"
                : "border-blush text-cocoa-soft hover:border-rose/60 hover:text-rose-deep"
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.slug || c.id}
              onClick={() => selectCategory(c.slug || c.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold border transition-all duration-300 ${
                active === (c.slug || c.id)
                  ? "bg-rose text-ivory border-rose shadow-sm shadow-rose/20"
                  : "border-blush text-cocoa-soft hover:border-rose/60 hover:text-rose-deep"
              }`}
            >
              {c.name}
            </button>
          ))}
        </ScrollReveal>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filtered.map((p, i) => (
                <ScrollReveal key={p.id} delay={i * 60} distance={16}>
                  <ProductCard product={p} whatsapp={whatsapp} />
                </ScrollReveal>
              ))}
            </motion.div>
          </AnimatePresence>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <CakeSlice className="w-10 h-10 text-rose/40 mx-auto mb-4" strokeWidth={1.5} aria-hidden="true" />
            <p className="text-cocoa-soft/70 text-lg">
              Nothing in this category yet — check back soon, or message us on WhatsApp for a custom order.
            </p>
          </motion.div>
        )}
      </section>
    </>
  );
}
