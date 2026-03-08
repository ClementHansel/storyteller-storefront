import { Link } from "react-router-dom";
import { storeName, storeTagline } from "@/config/store-config";
import { MapPin, Instagram, Mail } from "lucide-react";

const STORE_LOCATIONS = [
  { name: "Seminyak", mapUrl: "https://maps.google.com/?q=Seminyak+Bali" },
  {
    name: "66 (Double Six)",
    mapUrl: "https://maps.google.com/?q=Double+Six+Seminyak+Bali",
  },
  {
    name: "Sahadewa",
    mapUrl: "https://maps.google.com/?q=Sahadewa+Denpasar+Bali",
  },
];

export function Footer() {
  return (
    <footer className="bg-ink text-white relative overflow-hidden">
      {/* Decorative background text */}
      <div className="absolute top-0 right-0 opacity-5 select-none pointer-events-none translate-x-1/4 -translate-y-1/4">
        <span className="text-[30vw] font-black tracking-tighter italic">
          BALI
        </span>
      </div>

      <div className="container py-32 relative z-10">
        <div className="grid gap-16 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <h3 className="font-display text-5xl md:text-7xl font-black tracking-tighter mb-8 leading-none">
              BAMBU
              <br />
              <span className="text-primary italic">SILVER.</span>
            </h3>
            <p className="max-w-md text-white/50 text-lg font-light leading-relaxed">
              We create jewelry for the bold, the vibrant, and the visionary.
              Every piece is a testament to the soul of Bali and the art of the
              handmade.
            </p>
          </div>

          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-8">
              Navigation
            </h4>
            <nav className="flex flex-col gap-4">
              <Link
                to="/chapters"
                className="text-sm font-black uppercase tracking-widest hover:text-primary transition-all hover:translate-x-2"
              >
                Collections
              </Link>
              <Link
                to="/search"
                className="text-sm font-black uppercase tracking-widest hover:text-primary transition-all hover:translate-x-2"
              >
                Shop All
              </Link>
              <Link
                to="/contact"
                className="text-sm font-black uppercase tracking-widest hover:text-primary transition-all hover:translate-x-2"
              >
                Contact Us
              </Link>
              <Link
                to="/wishlist"
                className="text-sm font-black uppercase tracking-widest hover:text-primary transition-all hover:translate-x-2"
              >
                Wishlist
              </Link>
            </nav>
          </div>

          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-8">
              Locations
            </h4>
            <div className="flex flex-col gap-4">
              {STORE_LOCATIONS.map((store) => (
                <a
                  key={store.name}
                  href={store.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 text-sm font-black uppercase tracking-widest hover:text-primary transition-all"
                >
                  <MapPin className="h-4 w-4 text-primary group-hover:scale-125 transition-transform" />
                  {store.name}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-32 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex gap-8">
            <a
              href="https://instagram.com"
              className="hover:text-primary transition-colors hover:scale-110"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a
              href="mailto:hello@bambusilver.com"
              className="hover:text-primary transition-colors hover:scale-110"
            >
              <Mail className="h-5 w-5" />
            </a>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/30">
            © {new Date().getFullYear()} BAMBU SILVER. ALL RIGHTS RESERVED.
          </p>
          <p className="text-[10px] font-black uppercase tracking-widest text-primary italic">
            Handcrafted with intention in Bali
          </p>
        </div>
      </div>
    </footer>
  );
}
