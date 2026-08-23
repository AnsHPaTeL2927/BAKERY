import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState, lazy, Suspense } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import WhatsAppFloat from "./components/WhatsAppFloat";
import GlobalLoader from "./components/loading/GlobalLoader";
import Home from "./pages/Home";

// Split out of the initial bundle. The admin panel matters most: it pulls in
// Recharts and every admin screen, none of which a public visitor ever runs,
// yet all of it used to ship in the same single chunk as the storefront.
const About = lazy(() => import("./pages/About"));
const Menu = lazy(() => import("./pages/Menu"));
const CustomCake = lazy(() => import("./pages/CustomCake"));
const FestivalSpecials = lazy(() => import("./pages/FestivalSpecials"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Reviews = lazy(() => import("./pages/Reviews"));
const Contact = lazy(() => import("./pages/Contact"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const AdminApp = lazy(() => import("./admin/AdminApp"));
import { trackEvent, getSiteSettings } from "./services/api";
import { applyFavicon } from "./utils/favicon";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    if (!pathname.startsWith("/admin")) {
      trackEvent("PAGE_VIEW");
    }
  }, [pathname]);
  return null;
}

const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
};

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={pageTransition.initial}
        animate={pageTransition.animate}
        exit={pageTransition.exit}
        transition={pageTransition.transition}
      >
        <Suspense fallback={<div className="min-h-[60vh]" />}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/custom-cake" element={<CustomCake />} />
            <Route path="/festival-specials" element={<FestivalSpecials />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  const [initialLoading, setInitialLoading] = useState(true);

  // A fixed delay before the site is revealed, so the branded splash does not
  // flash by. It is pure added latency on every visit, so it is kept to the
  // shortest span that still reads as intentional rather than as a glitch —
  // adjust to taste, or drop the loader entirely to reveal content instantly.
  useEffect(() => {
    const id = setTimeout(() => setInitialLoading(false), 350);
    return () => clearTimeout(id);
  }, []);

  // Applies the configured favicon once at boot — this single document is
  // shared by both the public site and /admin/*, so one application here
  // covers every route; AdminSettings re-applies it live after a save.
  useEffect(() => {
    getSiteSettings().then((settings) => {
      applyFavicon(settings?.favicon, settings?.updatedAt);
    });
  }, []);

  return (
    <BrowserRouter>
      <GlobalLoader visible={initialLoading} />
      <ScrollToTop />
      <Routes>
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={<GlobalLoader visible />}>
              <AdminApp />
            </Suspense>
          }
        />
        <Route
          path="*"
          element={
            <div className="flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-1 pt-16 md:pt-20">
                <AnimatedRoutes />
              </main>
              <Footer />
              <WhatsAppFloat />
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
