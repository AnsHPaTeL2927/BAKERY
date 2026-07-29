import { useState } from "react";
import { waLink } from "../data/mockData";

export default function ProductCard({ product }) {
  const [weight, setWeight] = useState(product.weights[0]);
  const price = product.priceByWeight[weight];

  const orderMessage = `Hi! I'd like to order:\n${product.name} (${weight}) - ₹${price}`;

  return (
    <div className="bg-ivory rounded-3xl overflow-hidden shadow-sm border border-blush/60 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col">
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-5 flex flex-col gap-2 flex-1">
        <h3 className="font-display font-semibold text-lg text-cocoa">{product.name}</h3>
        <p className="text-sm text-cocoa-soft/80 line-clamp-2">{product.description}</p>

        {product.weights.length > 1 && (
          <div className="flex flex-wrap gap-2 mt-1">
            {product.weights.map((w) => (
              <button
                key={w}
                onClick={() => setWeight(w)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  w === weight
                    ? "bg-rose text-ivory border-rose"
                    : "border-blush text-cocoa-soft hover:border-rose"
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        )}

        <div className="mt-auto pt-3 flex items-center justify-between">
          <span className="font-display font-semibold text-xl text-rose-deep">₹{price}</span>
          {!product.available && (
            <span className="text-xs font-semibold text-cocoa-soft/60">Unavailable</span>
          )}
        </div>

        <a
          href={waLink(orderMessage)}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!product.available}
          className={`mt-2 text-center rounded-full py-2.5 font-semibold text-sm transition-colors ${
            product.available
              ? "bg-rose text-ivory hover:bg-rose-deep"
              : "bg-blush/60 text-cocoa-soft/60 pointer-events-none"
          }`}
        >
          Order on WhatsApp
        </a>
      </div>
    </div>
  );
}
