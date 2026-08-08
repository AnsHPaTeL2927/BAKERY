// Small inline spinner for submit buttons, replacing plain "Saving…" text.
export default function ButtonLoader({ label = "Saving…", className = "" }) {
  return (
    <span className={`inline-flex items-center justify-center gap-2 ${className}`}>
      <span
        className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent opacity-80"
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
