import { Link } from 'react-router-dom';
import { storeName, storeTagline } from '@/config/store-config';
import { MapPin, Instagram, Mail } from 'lucide-react';

const STORE_LOCATIONS = [
  { name: 'Seminyak', mapUrl: 'https://maps.google.com/?q=Seminyak+Bali' },
  { name: '66 (Double Six)', mapUrl: 'https://maps.google.com/?q=Double+Six+Seminyak+Bali' },
  { name: 'Sahadewa', mapUrl: 'https://maps.google.com/?q=Sahadewa+Denpasar+Bali' },
];

export function Footer() {
  return (
    <footer className="bg-foreground text-background mt-auto">
      <div className="container py-16">
        <div className="grid gap-12 md:grid-cols-4">
          <div>
            <h3 className="font-display text-2xl font-bold">{storeName}</h3>
            <p className="mt-3 text-sm text-background/60 leading-relaxed">
              Bold silver. Vibrant soul. Handcrafted in Bali with passion and intention.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-background/40 mb-4">Explore</h4>
            <nav className="flex flex-col gap-3">
              <Link to="/chapters" className="text-sm text-background/70 hover:text-primary transition-colors">Collections</Link>
              <Link to="/search" className="text-sm text-background/70 hover:text-primary transition-colors">Shop All</Link>
              <Link to="/contact" className="text-sm text-background/70 hover:text-primary transition-colors">Contact Us</Link>
            </nav>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-background/40 mb-4">Visit Us</h4>
            <div className="flex flex-col gap-3">
              {STORE_LOCATIONS.map((store) => (
                <a
                  key={store.name}
                  href={store.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-background/70 hover:text-primary transition-colors"
                >
                  <MapPin className="h-3 w-3 shrink-0" />
                  {store.name}
                </a>
              ))}
              <a
                href="https://maps.google.com/?q=Kedonganan+Bali"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-background/70 hover:text-primary transition-colors"
              >
                <MapPin className="h-3 w-3 shrink-0" />
                Kedonganan Office
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-background/40 mb-4">Connect</h4>
            <div className="flex flex-col gap-3">
              <a href="mailto:hello@bambusilver.com" className="flex items-center gap-2 text-sm text-background/70 hover:text-primary transition-colors">
                <Mail className="h-3 w-3" /> hello@bambusilver.com
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-background/70 hover:text-primary transition-colors">
                <Instagram className="h-3 w-3" /> @bambusilver
              </a>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-background/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-background/40">© {new Date().getFullYear()} {storeName}. All rights reserved.</p>
          <p className="text-xs text-background/40 tracking-widest uppercase font-bold">Handcrafted · Bold · Bali</p>
        </div>
      </div>
    </footer>
  );
}
