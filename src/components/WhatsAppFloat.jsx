import { MessageCircle } from "lucide-react";
import { waLink } from "../data/mockData";

export default function WhatsAppFloat() {
  return (
    <a
      href={waLink("Hi! I'd like to place an order with Cakes by Tulsi.")}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 bg-rose text-ivory pl-4 pr-5 py-3 rounded-full shadow-lg shadow-rose-deep/30 hover:bg-rose-deep transition-colors group"
      aria-label="Order on WhatsApp"
    >
      <MessageCircle className="w-5 h-5" />
      <span className="hidden sm:inline font-semibold text-sm">Order on WhatsApp</span>
    </a>
  );
}
