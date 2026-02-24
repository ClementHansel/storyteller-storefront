import { Link } from 'react-router-dom';
import { storeName, storeTagline } from '@/config/store-config';
import { MapPin } from 'lucide-react';

const STORE_LOCATIONS = [
  { name: 'Seminyak', mapUrl: 'https://maps.google.com/?q=Seminyak+Bali' },
  { name: '66 (Double Six)', mapUrl: 'https://maps.google.com/?q=Double+Six+Seminyak+Bali' },
  { name: 'Sahadewa', mapUrl: 'https://maps.google.com/?q=Sahadewa+Denpasar+Bali' },
];

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-card/50 mt-auto">
      <div className="container py-16">
        <div className="grid gap-12 md:grid-cols-4">
          <div>
            <h3 className="font-serif text-2xl font-light text-foreground">{storeName}</h3>
            <p className="mt-3 text-sm text-muted-foreground max-w-sm leading-relaxed">{storeTagline}. Handcrafted with intention, designed to be treasured.</p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-4">Explore</h4>
            <nav className="flex flex-col gap-3">
              <Link to="/chapters" className="text-sm text-foreground/70 hover:text-foreground transition-colors">Collections</Link>
              <Link to="/search" className="text-sm text-foreground/70 hover:text-foreground transition-colors">Shop All</Link>
              <Link to="/contact" className="text-sm text-foreground/70 hover:text-foreground transition-colors">Contact Us</Link>
            </nav>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-4">Our Stores</h4>
            <div className="flex flex-col gap-3">
              {STORE_LOCATIONS.map((store) => (
                <a
                  key={store.name}
                  href={store.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground transition-colors"
                >
                  <MapPin className="h-3 w-3 shrink-0" />
                  {store.name}
                </a>
              ))}
              <a
                href="https://maps.google.com/?q=Kedonganan+Bali"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground transition-colors"
              >
                <MapPin className="h-3 w-3 shrink-0" />
                Kedonganan Office
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-4">About</h4>
            <p className="text-sm text-foreground/70 leading-relaxed">
              Every piece is handcrafted with intention. Sterling silver, ethically sourced, made to last lifetimes.
            </p>
          </div>
        </div>
        <div className="mt-12 border-t border-border/50 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} {storeName}. All rights reserved.</p>
          <p className="text-xs text-muted-foreground tracking-wider">HANDCRAFTED · ETHICAL · TIMELESS</p>
        </div>
      </div>
    </footer>
  );
}
