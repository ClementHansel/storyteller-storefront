import { Link } from 'react-router-dom';
import { storeName, storeTagline } from '@/config/store-config';

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-card/50 mt-auto">
      <div className="container py-16">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <h3 className="font-serif text-2xl font-light text-foreground">{storeName}</h3>
            <p className="mt-3 text-sm text-muted-foreground max-w-sm leading-relaxed">{storeTagline}. Handcrafted with intention, designed to be treasured.</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-4">Explore</h4>
            <nav className="flex flex-col gap-3">
              <Link to="/chapters" className="text-sm text-foreground/70 hover:text-foreground transition-colors">Collections</Link>
              <Link to="/search" className="text-sm text-foreground/70 hover:text-foreground transition-colors">Shop All</Link>
              <Link to="/cart" className="text-sm text-foreground/70 hover:text-foreground transition-colors">Cart</Link>
            </nav>
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
