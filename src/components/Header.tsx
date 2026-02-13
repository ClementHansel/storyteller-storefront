import { Link } from 'react-router-dom';
import { storeName } from '@/config/store-config';
import { FastSearch } from './FastSearch';
import { ThemeToggle } from './ThemeToggle';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { ShoppingBag, Menu, Heart, User, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { toast } from 'sonner';

export function Header() {
  const { itemCount } = useCart();
  const { isAuthenticated, loginUrl, user, devLogout } = useAuth();

  const handleAuthAction = (action: string) => {
    if (!isAuthenticated) {
      toast.info('Please sign in to access your ' + action, {
        action: { label: 'Sign In', onClick: () => window.location.href = loginUrl },
      });
      return false;
    }
    return true;
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="shrink-0 group">
          <span className="font-serif text-2xl font-light tracking-tight text-foreground transition-colors group-hover:text-accent">
            {storeName}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors">
            Home
          </Link>
          <Link to="/chapters" className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors">
            Collections
          </Link>
          <Link to="/search" className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors">
            Shop
          </Link>
        </nav>

        {/* Desktop search */}
        <div className="hidden md:block flex-1 max-w-xs ml-auto mr-2">
          <FastSearch />
        </div>

        {/* Icon bar */}
        <div className="flex items-center gap-1">
          <ThemeToggle />

          {/* Wishlist */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
            onClick={() => handleAuthAction('wishlist')}
          >
            <Heart className="h-4 w-4" />
          </Button>

          {/* Cart */}
          {isAuthenticated ? (
            <Link to="/cart" className="relative">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                <ShoppingBag className="h-4 w-4" />
                {itemCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-semibold text-accent-foreground">
                    {itemCount}
                  </span>
                )}
              </Button>
            </Link>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              onClick={() => handleAuthAction('cart')}
            >
              <ShoppingBag className="h-4 w-4" />
            </Button>
          )}

          {/* Auth */}
          {isAuthenticated ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              onClick={devLogout}
              title={`Signed in as ${user?.name}`}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          ) : (
            <Link to={loginUrl}>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                <User className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="h-9 w-9"><Menu className="h-5 w-5" /></Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle className="font-serif text-2xl font-light">{storeName}</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FastSearch />
            </div>
            <nav className="mt-8 flex flex-col gap-5">
              <Link to="/" className="text-sm font-medium uppercase tracking-[0.15em] text-foreground hover:text-accent transition-colors">Home</Link>
              <Link to="/chapters" className="text-sm font-medium uppercase tracking-[0.15em] text-foreground hover:text-accent transition-colors">Collections</Link>
              <Link to="/search" className="text-sm font-medium uppercase tracking-[0.15em] text-foreground hover:text-accent transition-colors">Shop</Link>
              <div className="border-t border-border pt-4">
                {isAuthenticated ? (
                  <>
                    <Link to="/cart" className="block text-sm font-medium text-foreground hover:text-accent transition-colors mb-3">Cart ({itemCount})</Link>
                    <button onClick={devLogout} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign Out</button>
                  </>
                ) : (
                  <Link to={loginUrl} className="text-sm font-medium text-accent hover:text-foreground transition-colors">Sign In</Link>
                )}
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
