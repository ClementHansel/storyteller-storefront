import { Link } from 'react-router-dom';
import { storeName } from '@/config/store-config';
import { FastSearch } from './FastSearch';
import { useCart } from '@/contexts/CartContext';
import { ShoppingBag, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';

export function Header() {
  const { itemCount } = useCart();
  const [mobileSearch, setMobileSearch] = useState(false);

  const navLinks = [
    { label: 'Home', to: '/' },
    { label: 'Chapters', to: '/chapters' },
    { label: 'Cart', to: '/cart' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="shrink-0 font-serif text-xl font-bold text-foreground tracking-tight">
          {storeName}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Desktop search */}
        <div className="hidden md:block flex-1 max-w-sm ml-auto mr-4">
          <FastSearch />
        </div>

        {/* Cart icon */}
        <Link to="/cart" className="relative">
          <ShoppingBag className="h-5 w-5 text-foreground" />
          {itemCount > 0 && (
            <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {itemCount}
            </span>
          )}
        </Link>

        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetHeader><SheetTitle className="font-serif">{storeName}</SheetTitle></SheetHeader>
            <div className="mt-6">
              <FastSearch />
            </div>
            <nav className="mt-6 flex flex-col gap-4">
              {navLinks.map((l) => (
                <Link key={l.to} to={l.to} className="text-base font-medium text-foreground hover:text-primary transition-colors">
                  {l.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
