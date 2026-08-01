import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { getPublicContent, trackEvent } from "../services/api";

export default function WhatsAppFloat() {
  const [settings, setSettings] = useState({});

  useEffect(() => {
    getPublicContent().then((data) => setSettings(data.settings || {})).catch(() => {});
  }, []);

  const waLink = (message) => `https://wa.me/${settings.whatsapp || '918780652597'}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={waLink("Hi! I'd like to place an order with Cakes by Tulsi.")}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent("WHATSAPP_CLICK")}
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 bg-rose text-ivory pl-4 pr-5 py-3 rounded-full shadow-lg shadow-rose-deep/30 hover:bg-rose-deep transition-colors group"
      aria-label="Order on WhatsApp"
    >
      <MessageCircle className="w-5 h-5" />
      <span className="hidden sm:inline font-semibold text-sm">Order on WhatsApp</span>
    </a>
  );
}
