import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import ProductCard from "../components/ProductCard";
import { categories, products } from "../data/mockData";

export default function Menu() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";
  const [active, setActive] = useState(initialCategory);

  useEffect(() => {
    setActive(searchParams.get("category") || "all");
  }, [searchParams]);

  const filtered = useMemo(
    () => (active === "all" ? products : products.filter((p) => p.category === active)),
    [active]
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

      <section className="max-w-6xl mx-auto px-5 md:px-8 py-10 md:py-14">
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          <button
            onClick={() => selectCategory("all")}
            className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
              active === "all" ? "bg-rose text-ivory border-rose" : "border-blush text-cocoa-soft hover:border-rose"
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.slug}
              onClick={() => selectCategory(c.slug)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                active === c.slug ? "bg-rose text-ivory border-rose" : "border-blush text-cocoa-soft hover:border-rose"
              }`}
            >
              {c.emoji} {c.name}
            </button>
          ))}
        </div>

        {filtered.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <p className="text-center text-cocoa-soft/70 py-14">
            Nothing in this category yet — check back soon, or message us on WhatsApp for a custom order.
          </p>
        )}
      </section>
    </>
  );
}
