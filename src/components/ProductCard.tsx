import { Link } from "react-router-dom";
import { Product } from "@/types";
import { ProductImage } from "./ProductImage";
import { Button } from "./ui/button";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.info("Please sign in to add items to your cart", {
        action: {
          label: "Sign In",
          onClick: () => (window.location.href = "/login"),
        },
      });
      return;
    }
    addItem(product);
  };

  return (
    <div className="group relative">
      <Link to={`/product/${product.slug}`} className="block">
        <div className="relative overflow-hidden rounded-[2rem] bg-black/[0.03] border border-black/5 transition-all duration-700 hover:rounded-[1rem] hover:shadow-2xl hover:shadow-primary/10">
          <ProductImage
            src={product.images[0]}
            alt={product.title}
            className="transition-transform duration-1000 group-hover:scale-110 group-hover:rotate-2"
          />

          {/* Quick add floating button */}
          <div className="absolute top-4 right-4 z-20">
            <Button
              size="icon"
              className="h-10 w-10 rounded-full bg-black text-white hover:bg-primary hover:text-white transition-all transform scale-0 group-hover:scale-100 duration-500 shadow-xl"
              onClick={(e) => {
                e.preventDefault();
                handleAddToCart();
              }}
              disabled={!product.inStock}
            >
              <ShoppingBag className="h-4 w-4" />
            </Button>
          </div>

          {/* Tags */}
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
            {!product.inStock && (
              <span className="bg-black text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-black/10">
                Out of Stock
              </span>
            )}
            {product.compareAtPrice && (
              <span className="bg-primary text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full animate-pulse shadow-lg">
                Season Flash
              </span>
            )}
          </div>

          {/* Price overlay - artistic */}
          <div className="absolute inset-x-0 bottom-0 p-6 z-20 flex items-end justify-between translate-y-full group-hover:translate-y-0 transition-transform duration-500 bg-gradient-to-t from-black/20 to-transparent">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                Handcrafted
              </span>
              <span className="text-2xl font-black text-black leading-none">
                ${product.price}
              </span>
            </div>
            {product.compareAtPrice && (
              <span className="text-xs text-black/50 line-through font-light">
                ${product.compareAtPrice}
              </span>
            )}
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-display text-xl font-black text-foreground uppercase tracking-tighter group-hover:text-primary transition-colors leading-tight">
            {product.title}
          </h3>
          <p className="text-[10px] text-primary uppercase tracking-[0.2em] font-black mt-2">
            Bali Edition
          </p>
        </div>
      </Link>
    </div>
  );
}
