import { Link } from "react-router-dom";
import { storeName } from "@/config/store-config";
import { FastSearch } from "./FastSearch";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { ShoppingBag, Menu, Heart, User, X } from "lucide-react";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { toast } from "sonner";
import logo from "../assets/logo.png";

export function Header() {
  const { itemCount } = useCart();
  const { isAuthenticated, loginUrl, user, logout } = useAuth();

  const handleAuthAction = (action: string) => {
    if (!isAuthenticated) {
      toast.info("Please sign in to access your " + action, {
        action: {
          label: "Sign In",
          onClick: () => (window.location.href = loginUrl),
        },
      });
      return false;
    }
    return true;
  };

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container flex h-16 items-center gap-6">
        {/* Logo */}
        <Link to="/" className="shrink-0 group">
          <img
            src={logo}
            alt={storeName}
            className="h-10 md:h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
          />
        </Link>

        {/* Search — center (desktop) */}
        <div className="hidden md:block flex-1 max-w-lg mx-auto">
          <FastSearch />
        </div>

        {/* Icon cluster */}
        <div className="ml-auto flex items-center gap-1">
          {/* Account */}
          {isAuthenticated ? (
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:inline-flex items-center gap-1.5 h-9 px-3 text-sm text-muted-foreground hover:text-primary"
              onClick={logout}
              title={`Signed in as ${user?.name}`}
            >
              <User className="h-4 w-4" />
              <span className="hidden lg:inline">Account</span>
            </Button>
          ) : (
            <Link to={loginUrl}>
              <Button
                variant="ghost"
                size="sm"
                className="hidden md:inline-flex items-center gap-1.5 h-9 px-3 text-sm text-muted-foreground hover:text-primary"
              >
                <User className="h-4 w-4" />
                <span className="hidden lg:inline">Login</span>
              </Button>
            </Link>
          )}

          {/* Wishlist */}
          <Link to="/wishlist">
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:inline-flex items-center gap-1.5 h-9 px-3 text-sm text-muted-foreground hover:text-primary"
            >
              <Heart className="h-4 w-4" />
            </Button>
          </Link>

          {/* Cart */}
          {isAuthenticated ? (
            <Link to="/cart">
              <Button
                variant="ghost"
                size="sm"
                className="relative inline-flex items-center gap-1.5 h-9 px-3 text-sm text-muted-foreground hover:text-primary"
              >
                <ShoppingBag className="h-4 w-4" />
                {itemCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {itemCount}
                  </span>
                )}
              </Button>
            </Link>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="inline-flex items-center gap-1.5 h-9 px-3 text-sm text-muted-foreground hover:text-primary"
              onClick={() => handleAuthAction("cart")}
            >
              <ShoppingBag className="h-4 w-4" />
            </Button>
          )}

          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 bg-background">
              <SheetHeader>
                <SheetTitle className="font-display text-xl font-bold">
                  {storeName}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FastSearch />
              </div>
              <nav className="mt-8 flex flex-col gap-4">
                <Link to="/" className="text-sm font-semibold uppercase tracking-wider text-foreground hover:text-primary transition-colors">
                  Home
                </Link>
                <Link to="/chapters" className="text-sm font-semibold uppercase tracking-wider text-foreground hover:text-primary transition-colors">
                  Collections
                </Link>
                <Link to="/search" className="text-sm font-semibold uppercase tracking-wider text-foreground hover:text-primary transition-colors">
                  Shop
                </Link>
                <Link to="/contact" className="text-sm font-semibold uppercase tracking-wider text-foreground hover:text-primary transition-colors">
                  Contact
                </Link>
                <div className="border-t border-border pt-4">
                  {isAuthenticated ? (
                    <>
                      <Link to="/cart" className="block text-sm font-medium text-foreground hover:text-primary transition-colors mb-3">
                        Cart ({itemCount})
                      </Link>
                      <button onClick={logout} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <Link to={loginUrl} className="text-sm font-medium text-primary hover:text-foreground transition-colors">
                      Sign In
                    </Link>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Nav bar — desktop */}
      <nav className="hidden md:block border-t border-border/50">
        <div className="container flex h-10 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/chapters" className="text-xs font-bold uppercase tracking-widest text-foreground/70 hover:text-primary transition-colors">
              Collections
            </Link>
            <Link to="/search" className="text-xs font-bold uppercase tracking-widest text-foreground/70 hover:text-primary transition-colors">
              Shop All
            </Link>
            <Link to="/search?category=new" className="text-xs font-bold uppercase tracking-widest text-foreground/70 hover:text-primary transition-colors">
              New Arrivals
            </Link>
          </div>
          <div className="flex items-center gap-8">
            <Link to="/contact" className="text-xs font-bold uppercase tracking-widest text-foreground/70 hover:text-primary transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
