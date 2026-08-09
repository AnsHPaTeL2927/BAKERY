import { useEffect, useState } from "react";
import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";
import { InstagramIcon, FacebookIcon } from "../components/SocialIcons";
import PageHeader from "../components/PageHeader";
import ScrollReveal from "../components/ScrollReveal";
import { getPublicContent, trackEvent } from "../services/api";

export default function Contact() {
  const [settings, setSettings] = useState({});

  useEffect(() => {
    getPublicContent().then((data) => setSettings(data.settings || {})).catch(() => {});
  }, []);

  const waLink = (message) => `https://wa.me/${settings.whatsapp || '918780652597'}?text=${encodeURIComponent(message)}`;

  return (
    <>
      <PageHeader eyebrow="Get in Touch" title="Contact Us" description="Questions, custom orders, or just want to say hi? We'd love to hear from you." />

      <section className="max-w-6xl mx-auto px-5 md:px-8 py-14 md:py-20 grid md:grid-cols-2 gap-10">
        <div className="space-y-4">
          <ScrollReveal delay={0}>
            <ContactRow
              icon={Phone}
              label="Phone"
              value={settings.phone}
              href={`tel:${(settings.phone || '').replace(/\s/g, "")}`}
              onClick={() => trackEvent("CALL_CLICK")}
            />
          </ScrollReveal>
          <ScrollReveal delay={60}>
            <ContactRow
              icon={MessageCircle}
              label="WhatsApp"
              value="Chat with us instantly"
              href={waLink("Hi! I have a question about Cakes by Tulsi.")}
              onClick={() => trackEvent("WHATSAPP_CLICK")}
              external
            />
          </ScrollReveal>
          <ScrollReveal delay={120}>
            <ContactRow icon={Mail} label="Email" value={settings.email} href={`mailto:${settings.email}`} />
          </ScrollReveal>
          <ScrollReveal delay={180}>
            <ContactRow icon={MapPin} label="Address" value={settings.address} />
          </ScrollReveal>
          <ScrollReveal delay={240}>
            <ContactRow icon={Clock} label="Working Hours" value={settings.hours} />
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <div className="flex gap-3 pt-4">
              <a
                href={settings.instagram}
                className="p-3 rounded-full bg-blush-soft text-rose-deep hover:bg-blush hover:scale-105 transition-all duration-300"
                aria-label="Instagram"
              >
                <InstagramIcon className="w-5 h-5" />
              </a>
              <a
                href={settings.facebook}
                className="p-3 rounded-full bg-blush-soft text-rose-deep hover:bg-blush hover:scale-105 transition-all duration-300"
                aria-label="Facebook"
              >
                <FacebookIcon className="w-5 h-5" />
              </a>
            </div>
          </ScrollReveal>
        </div>

        <ScrollReveal direction="right" delay={100} className="h-full">
          <div className="rounded-3xl overflow-hidden border border-blush/50 shadow-sm h-full min-h-[300px] flex flex-col">
            <iframe
              title="Cakes by Tulsi location"
              src="https://www.google.com/maps?q=Vadodara,Gujarat,India&output=embed"
              className="w-full h-full min-h-[300px] flex-1 border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </ScrollReveal>
      </section>
    </>
  );
}

function ContactRow({ icon: Icon, label, value, href, external, onClick }) {
  const content = (
    <div className="flex items-start gap-4 bg-ivory rounded-2xl border border-blush/50 p-5 card-hover">
      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blush to-blush-soft flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-rose-deep" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-cocoa-soft/50">{label}</p>
        <p className="font-display font-semibold text-cocoa">{value}</p>
      </div>
    </div>
  );

  if (!href) return content;
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      onClick={onClick}
      className="block"
    >
      {content}
    </a>
  );
}
