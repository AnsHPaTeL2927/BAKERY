import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import WhatsAppFloat from "./components/WhatsAppFloat";
import GlobalLoader from "./components/loading/GlobalLoader";
import Home from "./pages/Home";
import About from "./pages/About";
import Menu from "./pages/Menu";
import CustomCake from "./pages/CustomCake";
import FestivalSpecials from "./pages/FestivalSpecials";
import Gallery from "./pages/Gallery";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import AdminApp from "./admin/AdminApp";
import { trackEvent } from "./services/api";

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

export default function App() {
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => setInitialLoading(false), 700);
    return () => clearTimeout(id);
  }, []);

  return (
    <BrowserRouter>
      <GlobalLoader visible={initialLoading} />
      <ScrollToTop />
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        <Route
          path="*"
          element={
            <div className="flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/menu" element={<Menu />} />
                  <Route path="/custom-cake" element={<CustomCake />} />
                  <Route path="/festival-specials" element={<FestivalSpecials />} />
                  <Route path="/gallery" element={<Gallery />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                </Routes>
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
