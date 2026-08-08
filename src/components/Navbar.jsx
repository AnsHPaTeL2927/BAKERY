import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { getPublicContent } from "../services/api";

const links = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/menu", label: "Menu" },
  { to: "/custom-cake", label: "Custom Cake" },
  { to: "/festival-specials", label: "Festival Specials" },
  { to: "/gallery", label: "Gallery" },
  { to: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [siteName, setSiteName] = useState('Cakes by Tulsi');

  useEffect(() => {
    getPublicContent()
      .then((data) => {
        if (data.settings?.siteName) setSiteName(data.settings.siteName);
      })
      .catch(() => {});
  }, []);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all ${
        scrolled ? "bg-cream/95 backdrop-blur shadow-sm" : "bg-cream/70 backdrop-blur"
      }`}
    >
      <nav className="max-w-6xl mx-auto px-5 md:px-8 flex items-center justify-between h-16 md:h-20">
        <NavLink to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="font-script text-3xl md:text-4xl text-rose-deep leading-none">
            {siteName}
          </span>
        </NavLink>

        <ul className="hidden lg:flex items-center gap-7 font-semibold text-sm text-cocoa-soft">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                end={l.to === "/"}
                className={({ isActive }) =>
                  `transition-colors hover:text-rose-deep ${isActive ? "text-rose-deep" : ""}`
                }
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <button
          className="lg:hidden p-2 text-cocoa"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {open && (
        <ul className="lg:hidden bg-ivory border-t border-blush px-5 py-4 flex flex-col gap-4 font-semibold text-cocoa-soft">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                end={l.to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `block py-1 ${isActive ? "text-rose-deep" : ""}`
                }
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
