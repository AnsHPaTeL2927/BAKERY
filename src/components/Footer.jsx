import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, MessageCircle } from "lucide-react";
import { InstagramIcon, FacebookIcon } from "./SocialIcons";
import { getPublicContent } from "../services/api";
import { resolveBrand } from "../utils/brand";
import ScrollReveal from "./ScrollReveal";

export default function Footer() {
  const [content, setContent] = useState({ settings: {}, categories: [] });
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    getPublicContent().then(setContent).catch(() => {});
  }, []);

  const siteConfig = content.settings || {};
  const categories = content.categories || [];
  const brand = resolveBrand(siteConfig);
  const showLogoImage = brand.type === "image" && !logoFailed;
  const brandName = brand.type === "image" ? brand.alt : brand.text;
  const waPhone = siteConfig.whatsapp || siteConfig.phone || "918780652597";
  const cleanPhone = (siteConfig.phone || "").replace(/\D/g, "");

  return (
    <footer className="bg-cocoa text-cream/90 mt-12 sm:mt-16 md:mt-24 relative overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 right-0 w-80 h-80 rounded-full bg-rose/5 blur-3xl" />
        <div className="absolute -bottom-24 left-0 w-72 h-72 rounded-full bg-gold/5 blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-10 sm:py-14">
        {/* Main Grid: Brand bio top on mobile, 2 cols for Links/Categories on mobile, 4 cols on tablet & desktop */}
        <div className="grid gap-8 sm:gap-10 grid-cols-1 md:grid-cols-4">
          {/* Brand Info */}
          <ScrollReveal distance={16} className="md:col-span-1">
            <div>
              {showLogoImage ? (
                <img
                  src={brand.src}
                  alt={brand.alt}
                  className="h-11 w-11 sm:h-12 sm:w-12 mb-3 rounded-full object-cover shadow-sm"
                  onError={() => setLogoFailed(true)}
                />
              ) : (
                <p className="font-script text-2xl sm:text-3xl text-blush mb-2 sm:mb-3">{brandName}</p>
              )}
              <p className="text-xs sm:text-sm text-cream/65 leading-relaxed max-w-sm">
                {siteConfig.description || "Freshly baked homemade cakes, brownies, and treats made to order with love and premium ingredients."}
              </p>

              {/* Social & WhatsApp Buttons */}
              <div className="flex items-center gap-2.5 mt-4">
                <a
                  href={`https://wa.me/${waPhone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="p-2.5 rounded-full bg-cream/10 hover:bg-rose hover:scale-105 transition-all duration-300 text-cream hover:text-ivory"
                  title="WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
                {siteConfig.instagram && (
                  <a
                    href={siteConfig.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="p-2.5 rounded-full bg-cream/10 hover:bg-rose hover:scale-105 transition-all duration-300 text-cream hover:text-ivory"
                  >
                    <InstagramIcon className="w-4 h-4" />
                  </a>
                )}
                {siteConfig.facebook && (
                  <a
                    href={siteConfig.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="p-2.5 rounded-full bg-cream/10 hover:bg-rose hover:scale-105 transition-all duration-300 text-cream hover:text-ivory"
                  >
                    <FacebookIcon className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </ScrollReveal>

          {/* Quick Links & Categories — Side-by-side on mobile, standalone columns on tablet & desktop */}
          <div className="grid grid-cols-2 gap-6 md:contents">
            <ScrollReveal distance={16} delay={40}>
              <div>
                <p className="font-display font-semibold text-blush text-sm sm:text-base mb-2.5 sm:mb-3">Quick Links</p>
                <ul className="space-y-2 text-xs sm:text-sm text-cream/65">
                  {[
                    { to: "/about", label: "About Us" },
                    { to: "/menu", label: "Menu" },
                    { to: "/custom-cake", label: "Custom Cake" },
                    { to: "/gallery", label: "Gallery" },
                    { to: "/reviews", label: "Reviews" },
                    { to: "/contact", label: "Contact" },
                  ].map((link) => (
                    <li key={link.to}>
                      <Link className="hover:text-blush transition-colors duration-200 link-underline" to={link.to}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>

            <ScrollReveal distance={16} delay={80}>
              <div>
                <p className="font-display font-semibold text-blush text-sm sm:text-base mb-2.5 sm:mb-3">Categories</p>
                <ul className="space-y-2 text-xs sm:text-sm text-cream/65">
                  {categories.slice(0, 6).map((c) => (
                    <li key={c.slug || c.id}>
                      <Link className="hover:text-blush transition-colors duration-200 link-underline truncate block" to={`/menu?category=${c.slug || c.id}`}>
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          </div>

          {/* Contact Details */}
          <ScrollReveal distance={16} delay={120}>
            <div>
              <p className="font-display font-semibold text-blush text-sm sm:text-base mb-2.5 sm:mb-3">Get in Touch</p>
              <ul className="space-y-2.5 text-xs sm:text-sm text-cream/65">
                {siteConfig.phone && (
                  <li>
                    <a href={`tel:${cleanPhone}`} className="flex items-start gap-2.5 hover:text-blush transition-colors">
                      <Phone className="w-4 h-4 mt-0.5 shrink-0 text-blush/80" />
                      <span>{siteConfig.phone}</span>
                    </a>
                  </li>
                )}
                {siteConfig.email && (
                  <li>
                    <a href={`mailto:${siteConfig.email}`} className="flex items-start gap-2.5 hover:text-blush transition-colors truncate">
                      <Mail className="w-4 h-4 mt-0.5 shrink-0 text-blush/80" />
                      <span className="truncate">{siteConfig.email}</span>
                    </a>
                  </li>
                )}
                {siteConfig.address && (
                  <li className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-blush/80" />
                    <span>{siteConfig.address}</span>
                  </li>
                )}
              </ul>
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="relative border-t border-cream/10 py-4 px-4 sm:px-6 md:px-8 text-[11px] sm:text-xs text-cream/50 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-6xl mx-auto text-center sm:text-left">
        <p>© {new Date().getFullYear()} {brandName}. All rights reserved.</p>
        <Link to="/privacy-policy" className="hover:text-blush transition-colors duration-200">
          Privacy Policy
        </Link>
      </div>
    </footer>
  );
}
