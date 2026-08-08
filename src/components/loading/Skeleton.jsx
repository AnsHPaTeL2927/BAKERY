// The one shared shimmer primitive — every other skeleton (table rows, cards,
// images) composes this instead of rolling its own animate-pulse block, so
// the loading feel stays consistent across the whole app.
export default function Skeleton({ className = "", theme = "public" }) {
  const base = theme === "admin" ? "bg-admin-border/60" : "bg-blush-soft";

  return (
    <div
      className={`relative overflow-hidden rounded-xl ${base} ${className}`}
    >
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.6s ease-in-out infinite",
        }}
      />
    </div>
  );
}
