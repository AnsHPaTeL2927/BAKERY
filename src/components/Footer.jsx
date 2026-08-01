import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Phone, Mail, MapPin } from "lucide-react";
import { InstagramIcon, FacebookIcon } from "./SocialIcons";
import { getPublicContent } from "../services/api";

export default function Footer() {
  const [content, setContent] = useState({ settings: {}, categories: [] });

  useEffect(() => {
    getPublicContent().then(setContent).catch(() => {});
  }, []);

  const siteConfig = content.settings || {};
  const categories = content.categories || [];

  return (
    <footer className="bg-cocoa text-cream/90 mt-24">
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-script text-3xl text-blush mb-3">{siteConfig.name}</p>
          <p className="text-sm text-cream/70 leading-relaxed">{siteConfig.description}</p>
          <div className="flex gap-3 mt-4">
            <a href={siteConfig.instagram} aria-label="Instagram" className="p-2 rounded-full bg-cream/10 hover:bg-rose transition-colors">
              <InstagramIcon className="w-4 h-4" />
            </a>
            <a href={siteConfig.facebook} aria-label="Facebook" className="p-2 rounded-full bg-cream/10 hover:bg-rose transition-colors">
              <FacebookIcon className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div>
          <p className="font-display font-semibold text-blush mb-3">Quick Links</p>
          <ul className="space-y-2 text-sm text-cream/70">
            <li><Link className="hover:text-blush" to="/about">About Us</Link></li>
            <li><Link className="hover:text-blush" to="/menu">Menu</Link></li>
            <li><Link className="hover:text-blush" to="/custom-cake">Custom Cake</Link></li>
            <li><Link className="hover:text-blush" to="/gallery">Gallery</Link></li>
            <li><Link className="hover:text-blush" to="/contact">Contact</Link></li>
          </ul>
        </div>

        <div>
          <p className="font-display font-semibold text-blush mb-3">Categories</p>
          <ul className="space-y-2 text-sm text-cream/70">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link className="hover:text-blush" to={`/menu?category=${c.slug}`}>{c.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-display font-semibold text-blush mb-3">Contact</p>
          <ul className="space-y-3 text-sm text-cream/70">
            <li className="flex items-start gap-2"><Phone className="w-4 h-4 mt-0.5 shrink-0" /> {siteConfig.phone}</li>
            <li className="flex items-start gap-2"><Mail className="w-4 h-4 mt-0.5 shrink-0" /> {siteConfig.email}</li>
            <li className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5 shrink-0" /> {siteConfig.address}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-cream/10 py-5 px-5 text-xs text-cream/50 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-6xl mx-auto">
        <p>© {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
        <Link to="/privacy-policy" className="hover:text-blush">Privacy Policy</Link>
      </div>
    </footer>
  );
}
