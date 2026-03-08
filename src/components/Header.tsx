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
  const { isAuthenticated, user, logout } = useAuth();

  const handleAuthAction = (action: string) => {
    if (!isAuthenticated) {
      toast.info("Please sign in to access your " + action, {
        action: {
          label: "Sign In",
          onClick: () => (window.location.href = "/login"),
        },
      });
      return false;
    }
    return true;
  };

  return (
    <header className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <div className="container max-w-7xl pointer-events-auto">
        <nav className="glass-dark rounded-full px-6 py-2 flex items-center justify-between shadow-2xl border-white/10 ring-1 ring-white/5 transition-all duration-500 hover:ring-white/20">
          {/* Logo */}
          <Link to="/" className="shrink-0 group flex items-center gap-2">
            <img
              src={logo}
              alt={storeName}
              className="h-8 md:h-10 w-auto object-contain transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110"
            />
            <span className="font-display font-black text-xs md:text-sm tracking-tighter text-white hidden sm:block uppercase">
              Bambu Silver
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 ml-8">
            <Link
              to="/chapters"
              className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 hover:text-primary transition-all hover:tracking-[0.3em]"
            >
              Collections
            </Link>
            <Link
              to="/search"
              className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 hover:text-primary transition-all hover:tracking-[0.3em]"
            >
              Shop
            </Link>
          </div>

          <div className="hidden md:flex flex-1 max-w-xs mx-auto px-4">
            <FastSearch />
          </div>

          {/* Icon cluster */}
          <div className="flex items-center gap-2">
            {/* Wishlist */}
            <Link to="/wishlist" className="hidden sm:block">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-white/70 hover:text-primary hover:bg-white/5 rounded-full"
              >
                <Heart className="h-4 w-4" />
              </Button>
            </Link>

            {/* Cart */}
            <Link to={isAuthenticated ? "/cart" : "/login"}>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-10 w-10 text-white hover:text-primary hover:bg-white/5 rounded-full ring-1 ring-white/10"
                onClick={() => !isAuthenticated && handleAuthAction("cart")}
              >
                <ShoppingBag className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-black text-white shadow-lg animate-pulse">
                    {itemCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* User/Auth */}
            {isAuthenticated ? (
              <Button
                variant="ghost"
                size="sm"
                className="hidden md:flex items-center gap-2 h-9 px-4 text-[10px] font-black uppercase tracking-widest text-white/70 hover:text-primary hover:bg-white/5 rounded-full"
                onClick={logout}
              >
                <User className="h-3.5 w-3.5" />
                <span>{user?.name?.split(" ")[0]}</span>
              </Button>
            ) : (
              <Link to="/login" className="hidden md:block">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-4 text-[10px] font-black uppercase tracking-widest text-white/70 hover:text-primary hover:bg-white/5 rounded-full"
                >
                  Login
                </Button>
              </Link>
            )}

            {/* Mobile Toggle */}
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-white"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="top"
                className="w-full h-fit bg-background/95 backdrop-blur-2xl border-b-white/10 pt-20"
              >
                <nav className="flex flex-col gap-6 items-center text-center pb-12">
                  <Link
                    to="/"
                    className="font-display text-4xl font-black text-foreground hover:text-primary tracking-tighter uppercase transition-all"
                  >
                    Home
                  </Link>
                  <Link
                    to="/chapters"
                    className="font-display text-4xl font-black text-foreground hover:text-primary tracking-tighter uppercase transition-all"
                  >
                    Collections
                  </Link>
                  <Link
                    to="/search"
                    className="font-display text-4xl font-black text-foreground hover:text-primary tracking-tighter uppercase transition-all"
                  >
                    Shop All
                  </Link>
                  <Link
                    to="/contact"
                    className="font-display text-4xl font-black text-foreground hover:text-primary tracking-tighter uppercase transition-all"
                  >
                    Contact
                  </Link>
                  <div className="w-full max-w-xs mt-4">
                    <FastSearch />
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </div>
    </header>
  );
}
