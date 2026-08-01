export default function Thumbnail({ src, alt }) {
  return (
    <div className="h-12 w-12 overflow-hidden rounded-xl bg-blush-soft">
      {src ? <img src={src} alt={alt || ''} className="h-full w-full object-cover" /> : null}
    </div>
  );
}
