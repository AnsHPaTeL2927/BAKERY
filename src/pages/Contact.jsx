import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";
import { InstagramIcon, FacebookIcon } from "../components/SocialIcons";
import PageHeader from "../components/PageHeader";
import { siteConfig, waLink } from "../data/mockData";

export default function Contact() {
  return (
    <>
      <PageHeader eyebrow="Get in Touch" title="Contact Us" description="Questions, custom orders, or just want to say hi? We'd love to hear from you." />

      <section className="max-w-6xl mx-auto px-5 md:px-8 py-14 md:py-20 grid md:grid-cols-2 gap-10">
        <div className="space-y-5">
          <ContactRow icon={Phone} label="Phone" value={siteConfig.phone} href={`tel:${siteConfig.phone.replace(/\s/g, "")}`} />
          <ContactRow
            icon={MessageCircle}
            label="WhatsApp"
            value="Chat with us instantly"
            href={waLink("Hi! I have a question about Cakes by Tulsi.")}
            external
          />
          <ContactRow icon={Mail} label="Email" value={siteConfig.email} href={`mailto:${siteConfig.email}`} />
          <ContactRow icon={MapPin} label="Address" value={siteConfig.address} />
          <ContactRow icon={Clock} label="Working Hours" value={siteConfig.hours} />

          <div className="flex gap-3 pt-2">
            <a href={siteConfig.social.instagram} className="p-3 rounded-full bg-blush-soft text-rose-deep hover:bg-blush transition-colors" aria-label="Instagram">
              <InstagramIcon className="w-5 h-5" />
            </a>
            <a href={siteConfig.social.facebook} className="p-3 rounded-full bg-blush-soft text-rose-deep hover:bg-blush transition-colors" aria-label="Facebook">
              <FacebookIcon className="w-5 h-5" />
            </a>
          </div>
        </div>

        <div className="rounded-3xl overflow-hidden border border-blush/60 min-h-72">
          <iframe
            title="Cakes by Tulsi location"
            src="https://www.google.com/maps?q=Vadodara,Gujarat,India&output=embed"
            className="w-full h-full min-h-72"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>
    </>
  );
}

function ContactRow({ icon: Icon, label, value, href, external }) {
  const content = (
    <div className="flex items-start gap-4 bg-ivory rounded-2xl border border-blush/60 p-5 hover:border-rose transition-colors">
      <div className="w-11 h-11 rounded-full bg-blush-soft flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-rose-deep" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-cocoa-soft/60">{label}</p>
        <p className="font-display font-semibold text-cocoa">{value}</p>
      </div>
    </div>
  );

  if (!href) return content;
  return (
    <a href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} className="block">
      {content}
    </a>
  );
}
