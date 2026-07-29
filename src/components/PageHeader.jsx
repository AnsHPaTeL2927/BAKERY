export default function PageHeader({ eyebrow, title, description }) {
  return (
    <section className="bg-blush-soft border-b border-blush">
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-14 md:py-20 text-center">
        {eyebrow && (
          <p className="font-script text-2xl text-rose-deep mb-1">{eyebrow}</p>
        )}
        <h1 className="font-display font-semibold text-3xl md:text-5xl text-cocoa">
          {title}
        </h1>
        {description && (
          <p className="mt-4 text-cocoa-soft/80 max-w-xl mx-auto">{description}</p>
        )}
      </div>
    </section>
  );
}
