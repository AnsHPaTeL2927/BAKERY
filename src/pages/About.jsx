import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import IcingDivider from "../components/IcingDivider";
import ScrollReveal from "../components/ScrollReveal";
import ParallaxLayer from "../components/ParallaxLayer";
import SafeImage from "../components/SafeImage";
import { getAboutContent } from "../services/api";

// Everything on this page is editable from the admin panel (Admin → About
// Page), but each field falls back to the copy below when it is blank, so the
// page never renders an empty section — including on a brand-new install where
// no About row exists at all.
const DEFAULTS = {
  chefHeading: "Meet the Baker",
  chefName: "Tulsi",
  chefBio: `What started as birthday cakes for family grew, one referral at a time, into a full home bakery. Every order is still mixed, baked, and decorated by hand — no shortcuts, no factory production lines, just the same care that went into the very first cake.

Today, Cakes by Tulsi bakes for birthdays, weddings, festivals, and the quiet everyday moments worth celebrating — using real butter, real chocolate, and recipes tested until they were exactly right.`,
  chefPhoto: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80",
  chefPhotoAlt: "Baker icing a cake by hand in a home kitchen",
  kitchen: [
    { src: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&q=80", alt: "Kitchen prep" },
    { src: "https://images.unsplash.com/photo-1587241321921-91a834d6d191?w=600&q=80", alt: "Fresh ingredients laid out" },
    { src: "https://images.unsplash.com/photo-1517433367423-c7e5b0f35086?w=600&q=80", alt: "Fresh bake cooling" },
  ],
};

// Blank strings count as "not set" — an admin who clears a field should get the
// default back rather than an empty heading.
function withFallback(value, fallback) {
  const trimmed = typeof value === "string" ? value.trim() : value;
  return trimmed || fallback;
}

export default function About() {
  const [about, setAbout] = useState(null);

  useEffect(() => {
    getAboutContent().then(setAbout);
  }, []);

  const chefHeading = withFallback(about?.chefHeading, DEFAULTS.chefHeading);
  const chefName = withFallback(about?.chefName, DEFAULTS.chefName);
  const chefPhoto = withFallback(about?.chefPhoto, DEFAULTS.chefPhoto);

  // A blank line separates paragraphs, matching the hint shown in the admin form.
  const bioParagraphs = withFallback(about?.chefBio, DEFAULTS.chefBio)
    .split(/\n\s*\n/)
    .map((para) => para.trim())
    .filter(Boolean);

  const kitchenImages = DEFAULTS.kitchen.map((fallback, i) => ({
    src: withFallback(about?.[`image${i + 1}`], fallback.src),
    alt: withFallback(about?.[`image${i + 1}Alt`], fallback.alt),
  }));

  return (
    <>
      <PageHeader
        eyebrow="Our Story"
        title="Baked with Heart, from Our Kitchen to Yours"
        description="Cakes by Tulsi began the way most good things do — with a home kitchen, a handful of recipes, and people who kept coming back for seconds."
      />

      <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-14 md:py-24 grid md:grid-cols-2 gap-6 sm:gap-12 items-center">
        <ScrollReveal direction="left">
          <div className="relative">
            <ParallaxLayer speed={0.06} className="absolute -inset-2.5 sm:-inset-4 bg-gradient-to-br from-blush to-blush-soft/40 rounded-2xl sm:rounded-[2rem] -rotate-2" />
            <SafeImage
              src={chefPhoto}
              alt={`${chefName} — ${chefHeading}`}
              blurLoad
              showSkeleton
              containerClassName="relative rounded-2xl sm:rounded-[2rem] overflow-hidden shadow-md aspect-[4/3]"
              className="w-full h-full object-cover"
            />
          </div>
        </ScrollReveal>
        <ScrollReveal direction="right" delay={100}>
          <p className="font-script text-xl sm:text-3xl text-rose-deep mb-1 sm:mb-2">{chefHeading}</p>
          <h2 className="font-display font-semibold text-2xl sm:text-3xl text-cocoa mb-3 sm:mb-4">{chefName}</h2>
          {bioParagraphs.map((para, i) => (
            <p
              key={i}
              className={`text-xs sm:text-base text-cocoa-soft/85 leading-relaxed${i > 0 ? " mt-3 sm:mt-4" : ""}`}
            >
              {para}
            </p>
          ))}
        </ScrollReveal>
      </section>

      <IcingDivider className="text-blush" />

      <section className="bg-blush-soft/50 py-10 sm:py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-6">
          {[
            { title: "Our Mission", text: "To make every celebration a little sweeter with desserts that taste homemade — because they are." },
            { title: "Quality Promise", text: "No preservatives, no shortcuts. If we wouldn't serve it to our own family, it doesn't leave the kitchen." },
            { title: "Fresh Ingredients", text: "Real butter, real chocolate, seasonal fruit — sourced in small batches every week." },
            { title: "Handmade Process", text: "Every layer, every swirl of icing, every flower is piped and placed by hand." },
          ].map((item, i) => (
            <ScrollReveal key={item.title} delay={i * 60} distance={16}>
              <div className="bg-ivory rounded-xl sm:rounded-2xl border border-blush/50 p-3.5 sm:p-6 card-hover h-full flex flex-col justify-between shadow-2xs">
                <div>
                  <p className="font-display font-semibold text-cocoa text-xs sm:text-base mb-1 sm:mb-2">{item.title}</p>
                  <p className="text-[11px] sm:text-sm text-cocoa-soft/70 leading-tight sm:leading-relaxed">{item.text}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-10 sm:py-16 md:py-24">
        <ScrollReveal>
          <div className="text-center mb-6 sm:mb-10">
            <p className="font-script text-xl sm:text-3xl text-rose-deep mb-1">Inside Our Kitchen</p>
            <h2 className="font-display font-semibold text-2xl sm:text-3xl md:text-4xl text-cocoa">Where It All Comes Together</h2>
          </div>
        </ScrollReveal>
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {kitchenImages.map((img, i) => (
            <ScrollReveal key={i} delay={i * 60} distance={12}>
              <div className="rounded-xl sm:rounded-2xl overflow-hidden aspect-square img-zoom-container bg-cream-deep/30 shadow-2xs">
                <SafeImage
                  src={img.src}
                  alt={img.alt}
                  loading="lazy"
                  blurLoad
                  showSkeleton
                  containerClassName="w-full h-full"
                  className="w-full h-full object-cover img-zoom-target"
                />
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>
    </>
  );
}
