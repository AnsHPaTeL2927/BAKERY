import { useEffect, useState } from "react";
import { Phone, Mail, MapPin, Clock, MessageCircle, ExternalLink, ChevronRight } from "lucide-react";
import { InstagramIcon, FacebookIcon } from "../components/SocialIcons";
import PageHeader from "../components/PageHeader";
import ScrollReveal from "../components/ScrollReveal";
import { getPublicContent, trackEvent } from "../services/api";
import { buildPublicWhatsAppLink } from "../utils/whatsapp";

export default function Contact() {
  const [settings, setSettings] = useState({});

  useEffect(() => {
    getPublicContent().then((data) => setSettings(data.settings || {})).catch(() => {});
  }, []);

  const waLink = (message) => buildPublicWhatsAppLink(settings.whatsapp, message);

  return (
    <>
      <PageHeader eyebrow="Get in Touch" title="Contact Us" description="Questions, custom orders, or just want to say hi? We'd love to hear from you." />

      <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-14 md:py-20 grid md:grid-cols-2 gap-6 sm:gap-10">
        <div className="space-y-3 sm:space-y-4">
          <ScrollReveal delay={0}>
            <ContactRow
              icon={Phone}
              label="Phone"
              value={settings.phone || "+91 87806 52597"}
              subtext="Tap to call"
              href={`tel:${(settings.phone || '918780652597').replace(/\s/g, "")}`}
              onClick={() => trackEvent("CALL_CLICK")}
            />
          </ScrollReveal>
          <ScrollReveal delay={50}>
            <ContactRow
              icon={MessageCircle}
              label="WhatsApp"
              value="Chat with us instantly"
              subtext="Quickest response"
              href={waLink("Hi! I have a question about Cakes by Tulsi.")}
              onClick={() => trackEvent("WHATSAPP_CLICK")}
              external
            />
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <ContactRow
              icon={Mail}
              label="Email"
              value={settings.email || "cakesbytulsi@gmail.com"}
              subtext="Tap to send email"
              href={`mailto:${settings.email || 'cakesbytulsi@gmail.com'}`}
            />
          </ScrollReveal>
          <ScrollReveal delay={150}>
            <ContactRow icon={MapPin} label="Address" value={settings.address || "Vadodara, Gujarat, India"} />
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <ContactRow icon={Clock} label="Working Hours" value={settings.hours || "Mon - Sun: 9:00 AM - 9:00 PM"} />
          </ScrollReveal>

          <ScrollReveal delay={250}>
            <div className="flex items-center gap-3 pt-2 sm:pt-4">
              <span className="text-xs font-semibold text-cocoa-soft/60 uppercase tracking-wider">Follow Us:</span>
              <div className="flex gap-2.5">
                {settings.instagram && (
                  <a
                    href={settings.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 sm:p-3 rounded-full bg-blush-soft text-rose-deep hover:bg-blush hover:scale-105 active:scale-95 transition-all shadow-2xs"
                    aria-label="Instagram"
                  >
                    <InstagramIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </a>
                )}
                {settings.facebook && (
                  <a
                    href={settings.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 sm:p-3 rounded-full bg-blush-soft text-rose-deep hover:bg-blush hover:scale-105 active:scale-95 transition-all shadow-2xs"
                    aria-label="Facebook"
                  >
                    <FacebookIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </a>
                )}
              </div>
            </div>
          </ScrollReveal>
        </div>

        <ScrollReveal direction="right" delay={100} className="h-full min-h-[260px] sm:min-h-[360px]">
          <div className="rounded-2xl sm:rounded-3xl overflow-hidden border border-blush/50 shadow-2xs h-full min-h-[260px] sm:min-h-[360px] flex flex-col relative bg-ivory">
            <div className="px-4 py-3 bg-blush-soft/50 border-b border-blush/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-deep shrink-0" />
                <p className="font-display font-semibold text-cocoa text-xs sm:text-sm">Find Our Kitchen</p>
              </div>
              <span className="text-[11px] text-cocoa-soft/65">Vadodara, Gujarat</span>
            </div>
            <iframe
              title="Cakes by Tulsi location"
              src="https://www.google.com/maps?q=Vadodara,Gujarat,India&output=embed"
              className="w-full h-full min-h-[220px] sm:min-h-[320px] flex-1 border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </ScrollReveal>
      </section>
    </>
  );
}

function ContactRow({ icon: Icon, label, value, subtext, href, external, onClick }) {
  const content = (
    <div className="flex items-center justify-between gap-3 bg-ivory rounded-2xl border border-blush/50 p-3.5 sm:p-5 card-hover shadow-2xs group">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-blush to-blush-soft flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-rose-deep" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-cocoa-soft/60">{label}</p>
          <p className="font-display font-semibold text-cocoa text-xs sm:text-base truncate">{value}</p>
        </div>
      </div>
      {href && (
        <div className="shrink-0 flex items-center gap-1 text-rose-deep group-hover:translate-x-0.5 transition-transform">
          {subtext && <span className="text-[11px] font-semibold hidden sm:inline">{subtext}</span>}
          {external ? <ExternalLink className="w-4 h-4 opacity-70" /> : <ChevronRight className="w-4 h-4 opacity-70" />}
        </div>
      )}
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
