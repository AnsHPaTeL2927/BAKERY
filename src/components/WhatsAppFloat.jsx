import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { getPublicContent, trackEvent } from "../services/api";
import { buildPublicWhatsAppLink } from "../utils/whatsapp";

export default function WhatsAppFloat() {
  const [settings, setSettings] = useState({});
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    getPublicContent().then((data) => setSettings(data.settings || {})).catch(() => {});
    // Delay appearance so it doesn't fight with the page load
    const id = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(id);
  }, []);

  const waLink = (message) => buildPublicWhatsAppLink(settings.whatsapp, message);

  if (!visible) return null;

  return (
    <motion.a
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      href={waLink("Hi! I'd like to place an order with Cakes by Tulsi.")}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent("WHATSAPP_CLICK")}
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 bg-rose text-ivory pl-4 pr-5 py-3 rounded-full shadow-lg shadow-rose-deep/25 hover:bg-rose-deep hover:shadow-xl hover:shadow-rose-deep/30 hover:scale-105 active:scale-100 transition-all duration-300 group"
      aria-label="Order on WhatsApp"
    >
      <MessageCircle className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" />
      <span className="hidden sm:inline font-semibold text-sm">Order on WhatsApp</span>
    </motion.a>
  );
}
