import { Link } from "react-router-dom";
import { storeName } from "@/config/store-config";
import { FastSearch } from "./FastSearch";
import { ThemeToggle } from "./ThemeToggle";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { ShoppingBag, Menu, Heart, User, LogOut, X } from "lucide-react";
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
  const { isAuthenticated, loginUrl, user, devLogout } = useAuth();

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
    <header className="sticky top-0 z-40 bg-background border-b border-border/40">
      {/* Top bar: Logo | Search | Icons */}
      <div className="container flex h-[72px] items-center gap-6">
        {/* Logo — left */}
        <Link to="/" className="shrink-0 group">
          <img
            src={logo}
            alt="Logo"
            className="h-12 w-auto object-contain transition-opacity group-hover:opacity-80"
          />
        </Link>

        {/* Search — center (desktop) */}
        <div className="hidden md:block flex-1 max-w-lg mx-auto">
          <FastSearch />
        </div>

        {/* Icon cluster — right */}
        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle />

          {/* Account */}
          {isAuthenticated ? (
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:inline-flex items-center gap-1.5 h-9 px-3 text-xs text-muted-foreground hover:text-foreground"
              onClick={devLogout}
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
                className="hidden md:inline-flex items-center gap-1.5 h-9 px-3 text-xs text-muted-foreground hover:text-foreground"
              >
                <User className="h-4 w-4" />
                <span className="hidden lg:inline">Login / Register</span>
              </Button>
            </Link>
          )}

          {/* Wishlist */}
          <Link to="/wishlist">
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:inline-flex items-center gap-1.5 h-9 px-3 text-xs text-muted-foreground hover:text-foreground"
            >
              <Heart className="h-4 w-4" />
              <span className="hidden lg:inline">Wishlist</span>
            </Button>
          </Link>

          {/* Cart */}
          {isAuthenticated ? (
            <Link to="/cart">
              <Button
                variant="ghost"
                size="sm"
                className="relative inline-flex items-center gap-1.5 h-9 px-3 text-xs text-muted-foreground hover:text-foreground"
              >
                <ShoppingBag className="h-4 w-4" />
                <span className="hidden lg:inline">{itemCount} item(s)</span>
                {itemCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-semibold text-accent-foreground lg:hidden">
                    {itemCount}
                  </span>
                )}
              </Button>
            </Link>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="inline-flex items-center gap-1.5 h-9 px-3 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => handleAuthAction("cart")}
            >
              <ShoppingBag className="h-4 w-4" />
            </Button>
          )}

          {/* Mobile menu trigger */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle className="font-serif text-2xl font-light">
                  {storeName}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FastSearch />
              </div>
              <nav className="mt-8 flex flex-col gap-5">
                <Link
                  to="/"
                  className="text-sm font-medium uppercase tracking-[0.15em] text-foreground hover:text-accent transition-colors"
                >
                  Home
                </Link>
                <Link
                  to="/chapters"
                  className="text-sm font-medium uppercase tracking-[0.15em] text-foreground hover:text-accent transition-colors"
                >
                  Collections
                </Link>
                <Link
                  to="/search"
                  className="text-sm font-medium uppercase tracking-[0.15em] text-foreground hover:text-accent transition-colors"
                >
                  Shop
                </Link>
                <Link
                  to="/search?category=new"
                  className="text-sm font-medium uppercase tracking-[0.15em] text-foreground hover:text-accent transition-colors"
                >
                  New Arrivals
                </Link>
                <div className="border-t border-border pt-4">
                  {isAuthenticated ? (
                    <>
                      <Link
                        to="/cart"
                        className="block text-sm font-medium text-foreground hover:text-accent transition-colors mb-3"
                      >
                        Cart ({itemCount})
                      </Link>
                      <button
                        onClick={devLogout}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <Link
                      to={loginUrl}
                      className="text-sm font-medium text-accent hover:text-foreground transition-colors"
                    >
                      Sign In
                    </Link>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Navigation bar — below (desktop) */}
      <nav className="hidden md:block border-t border-border/30 bg-background">
        <div className="container flex h-11 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              to="/chapters"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/80 hover:text-accent transition-colors"
            >
              Collections
            </Link>
            <Link
              to="/search"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/80 hover:text-accent transition-colors"
            >
              Shop All
            </Link>
            <Link
              to="/search?category=new"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/80 hover:text-accent transition-colors"
            >
              New Arrivals
            </Link>
          </div>
          <div className="flex items-center gap-8">
            <Link
              to="/contact"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/80 hover:text-accent transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
