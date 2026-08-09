import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

// Premium animated button with hover lift, press scale and optional arrow.
// Variants: "primary" (rose bg), "secondary" (outline), "ghost" (minimal).
// Can render as <a>, <Link>, or <button> via `as` / `to` / `href` props.
const VARIANTS = {
  primary:
    "bg-rose text-ivory shadow-md shadow-rose/25 hover:bg-rose-deep hover:shadow-lg hover:shadow-rose-deep/30",
  secondary:
    "border-2 border-cocoa/20 text-cocoa hover:border-rose hover:text-rose-deep",
  ghost:
    "text-rose-deep hover:text-rose hover:bg-blush-soft/50",
};

export default function AnimatedButton({
  children,
  variant = "primary",
  to,
  href,
  arrow = false,
  className = "",
  size = "md",
  ...rest
}) {
  const sizeClass =
    size === "lg"
      ? "px-8 py-4 text-base"
      : size === "sm"
        ? "px-5 py-2.5 text-sm"
        : "px-7 py-3.5 text-sm";

  const classes = [
    "inline-flex items-center gap-2 font-semibold rounded-full transition-all duration-300",
    "hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
    VARIANTS[variant] || VARIANTS.primary,
    sizeClass,
    className,
  ].join(" ");

  const content = (
    <>
      {children}
      {arrow && (
        <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={`group ${classes}`} {...rest}>
        {content}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={`group ${classes}`} {...rest}>
        {content}
      </a>
    );
  }
  return (
    <button className={`group ${classes}`} {...rest}>
      {content}
    </button>
  );
}
