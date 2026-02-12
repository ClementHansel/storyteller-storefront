import { Link } from 'react-router-dom';
import { storeName, storeTagline } from '@/config/store-config';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="font-serif text-lg font-bold text-foreground">{storeName}</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-xs">{storeTagline}</p>
          </div>
          <div>
            <h4 className="font-serif text-sm font-semibold text-foreground mb-3">Explore</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/chapters" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Story Chapters</Link>
              <Link to="/search" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Search</Link>
              <Link to="/cart" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Cart</Link>
            </nav>
          </div>
          <div>
            <h4 className="font-serif text-sm font-semibold text-foreground mb-3">About</h4>
            <p className="text-sm text-muted-foreground">
              Every piece is handcrafted with intention. Sterling silver, ethically sourced, made to last lifetimes.
            </p>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {storeName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
