import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Phone, Mail, MapPin } from "lucide-react";
import { InstagramIcon, FacebookIcon } from "./SocialIcons";
import { getPublicContent } from "../services/api";
import ScrollReveal from "./ScrollReveal";

export default function Footer() {
  const [content, setContent] = useState({ settings: {}, categories: [] });

  useEffect(() => {
    getPublicContent().then(setContent).catch(() => {});
  }, []);

  const siteConfig = content.settings || {};
  const categories = content.categories || [];

  return (
    <footer className="bg-cocoa text-cream/90 mt-24 relative overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 right-0 w-80 h-80 rounded-full bg-rose/5 blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-5 md:px-8 py-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <ScrollReveal distance={16}>
          <div>
            <p className="font-script text-3xl text-blush mb-3">{siteConfig.name}</p>
            <p className="text-sm text-cream/60 leading-relaxed">{siteConfig.description}</p>
            <div className="flex gap-3 mt-4">
              <a
                href={siteConfig.instagram}
                aria-label="Instagram"
                className="p-2.5 rounded-full bg-cream/10 hover:bg-rose hover:scale-105 transition-all duration-300"
              >
                <InstagramIcon className="w-4 h-4" />
              </a>
              <a
                href={siteConfig.facebook}
                aria-label="Facebook"
                className="p-2.5 rounded-full bg-cream/10 hover:bg-rose hover:scale-105 transition-all duration-300"
              >
                <FacebookIcon className="w-4 h-4" />
              </a>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal distance={16} delay={60}>
          <div>
            <p className="font-display font-semibold text-blush mb-3">Quick Links</p>
            <ul className="space-y-2.5 text-sm text-cream/60">
              {[
                { to: "/about", label: "About Us" },
                { to: "/menu", label: "Menu" },
                { to: "/custom-cake", label: "Custom Cake" },
                { to: "/gallery", label: "Gallery" },
                { to: "/contact", label: "Contact" },
              ].map((link) => (
                <li key={link.to}>
                  <Link className="hover:text-blush transition-colors duration-300 link-underline" to={link.to}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </ScrollReveal>

        <ScrollReveal distance={16} delay={120}>
          <div>
            <p className="font-display font-semibold text-blush mb-3">Categories</p>
            <ul className="space-y-2.5 text-sm text-cream/60">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link className="hover:text-blush transition-colors duration-300 link-underline" to={`/menu?category=${c.slug}`}>
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </ScrollReveal>

        <ScrollReveal distance={16} delay={180}>
          <div>
            <p className="font-display font-semibold text-blush mb-3">Contact</p>
            <ul className="space-y-3 text-sm text-cream/60">
              <li className="flex items-start gap-2.5"><Phone className="w-4 h-4 mt-0.5 shrink-0 text-cream/40" /> {siteConfig.phone}</li>
              <li className="flex items-start gap-2.5"><Mail className="w-4 h-4 mt-0.5 shrink-0 text-cream/40" /> {siteConfig.email}</li>
              <li className="flex items-start gap-2.5"><MapPin className="w-4 h-4 mt-0.5 shrink-0 text-cream/40" /> {siteConfig.address}</li>
            </ul>
          </div>
        </ScrollReveal>
      </div>

      <div className="relative border-t border-cream/10 py-5 px-5 text-xs text-cream/40 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-6xl mx-auto">
        <p>© {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
        <Link to="/privacy-policy" className="hover:text-blush transition-colors duration-300">Privacy Policy</Link>
      </div>
    </footer>
  );
}
