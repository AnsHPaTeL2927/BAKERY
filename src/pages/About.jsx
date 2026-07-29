import PageHeader from "../components/PageHeader";
import IcingDivider from "../components/IcingDivider";

export default function About() {
  return (
    <>
      <PageHeader
        eyebrow="Our Story"
        title="Baked with Heart, from Our Kitchen to Yours"
        description="Cakes by Tulsi began the way most good things do — with a home kitchen, a handful of recipes, and people who kept coming back for seconds."
      />

      <section className="max-w-6xl mx-auto px-5 md:px-8 py-14 md:py-20 grid md:grid-cols-2 gap-12 items-center">
        <img
          src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80"
          alt="Baker icing a cake by hand in a home kitchen"
          className="rounded-[2rem] shadow-lg w-full aspect-[4/3] object-cover"
        />
        <div>
          <p className="font-script text-2xl text-rose-deep mb-2">Meet the Baker</p>
          <h2 className="font-display font-semibold text-3xl text-cocoa mb-4">Tulsi</h2>
          <p className="text-cocoa-soft/85 leading-relaxed">
            What started as birthday cakes for family grew, one referral at a time, into a
            full home bakery. Every order is still mixed, baked, and decorated by hand —
            no shortcuts, no factory production lines, just the same care that went into
            the very first cake.
          </p>
          <p className="text-cocoa-soft/85 leading-relaxed mt-4">
            Today, Cakes by Tulsi bakes for birthdays, weddings, festivals, and the quiet
            everyday moments worth celebrating — using real butter, real chocolate, and
            recipes tested until they were exactly right.
          </p>
        </div>
      </section>

      <IcingDivider className="text-blush" />

      <section className="bg-blush-soft py-14 md:py-20">
        <div className="max-w-6xl mx-auto px-5 md:px-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <ValueCard
            title="Our Mission"
            text="To make every celebration a little sweeter with desserts that taste homemade — because they are."
          />
          <ValueCard
            title="Quality Promise"
            text="No preservatives, no shortcuts. If we wouldn't serve it to our own family, it doesn't leave the kitchen."
          />
          <ValueCard
            title="Fresh Ingredients"
            text="Real butter, real chocolate, seasonal fruit — sourced in small batches every week."
          />
          <ValueCard
            title="Handmade Process"
            text="Every layer, every swirl of icing, every flower is piped and placed by hand."
          />
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 md:px-8 py-14 md:py-20">
        <div className="text-center mb-10">
          <p className="font-script text-2xl text-rose-deep mb-1">Inside Our Kitchen</p>
          <h2 className="font-display font-semibold text-2xl md:text-4xl text-cocoa">Where It All Comes Together</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <img className="rounded-2xl aspect-square object-cover w-full" src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&q=80" alt="Kitchen prep" loading="lazy" />
          <img className="rounded-2xl aspect-square object-cover w-full" src="https://images.unsplash.com/photo-1587241321921-91a834d6d191?w=600&q=80" alt="Fresh ingredients laid out" loading="lazy" />
          <img className="rounded-2xl aspect-square object-cover w-full" src="https://images.unsplash.com/photo-1517433367423-c7e5b0f35086?w=600&q=80" alt="Fresh bake cooling" loading="lazy" />
        </div>
      </section>
    </>
  );
}

function ValueCard({ title, text }) {
  return (
    <div className="bg-ivory rounded-2xl border border-blush/60 p-6">
      <p className="font-display font-semibold text-cocoa mb-2">{title}</p>
      <p className="text-sm text-cocoa-soft/75 leading-relaxed">{text}</p>
    </div>
  );
}
