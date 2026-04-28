import { MessageCircle } from "lucide-react";
import { trackEvent } from "@/api/zenvix-events";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function WhatsAppButton() {
  const { user } = useAuth();
  const phoneNumber = "+6287860178395";
  const name = "Estela";

  const handleClick = async () => {
    // 1. Send event to backend
    try {
      await trackEvent("chat.initiated", user?.id || "anonymous", {
        channel: "whatsapp",
        recipient: name,
        recipient_phone: phoneNumber,
      });
    } catch (err) {
      console.warn("[WhatsApp] Failed to track chat initiation", err);
    }

    // 2. Open WhatsApp
    const message = encodeURIComponent("Hello Estela, I'm interested in Bambu Silver jewelry...");
    const waUrl = `https://wa.me/${phoneNumber.replace('+', '')}?text=${message}`;
    window.open(waUrl, "_blank");
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-8 right-8 z-[100] group flex items-center gap-3 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300"
      aria-label="Chat with Estela on WhatsApp"
    >
      <div className="flex flex-col items-end overflow-hidden max-w-0 group-hover:max-w-xs transition-all duration-500">
        <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100">
          Chat with
        </span>
        <span className="text-xs font-black uppercase tracking-tighter whitespace-nowrap opacity-0 group-hover:opacity-100">
          {name}
        </span>
      </div>
      <MessageCircle className="h-6 w-6 fill-white/20" />
      
      {/* Pulse effect */}
      <div className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20 -z-10" />
    </button>
  );
}
