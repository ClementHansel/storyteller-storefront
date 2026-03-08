import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { ProductImage } from "@/components/ProductImage";
import { useProduct } from "@/hooks/use-store";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, ArrowLeft, Heart } from "lucide-react";
import { toast } from "sonner";
import {
  addToWishlist,
  removeFromWishlist,
  isInWishlist,
} from "@/pages/WishlistPage";
import { addToWishlist as apiAddToWishlist } from "@/services/wishlistService";

const ProductDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading } = useProduct(slug || "");
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
    if (product) {
      addItem(product);
      toast.success("Added to your collection", {
        icon: <ShoppingBag className="h-4 w-4" />,
      });
    }
  };

  const [wishlisted, setWishlisted] = useState(() =>
    product ? isInWishlist(product.id) : false,
  );

  const handleWishlist = async () => {
    if (!product) return;
    if (wishlisted) {
      removeFromWishlist(product.id);
      setWishlisted(false);
      toast.success("Removed from wishlist");
    } else {
      addToWishlist(product);
      setWishlisted(true);
      toast.success("Added to wishlist");
      if (isAuthenticated) {
        try {
          await apiAddToWishlist(product.id);
        } catch {
          /* local already saved */
        }
      }
    }
  };

  useDocumentTitle(
    product ? `${product.title} — Bambu Silver` : "Product — Bambu Silver",
  );

  if (isLoading) {
    return (
      <Layout>
        <div className="container min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container py-40 text-center">
          <h1 className="font-display text-4xl font-black text-foreground mb-8">
            PRODUCT NOT FOUND
          </h1>
          <Button asChild rounded-full px-12>
            <Link to="/search">BACK TO SHOP</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="relative min-h-screen pt-32 pb-20 overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-secondary/5 rounded-full blur-[150px] translate-y-1/2 -translate-x-1/2" />

        <div className="container relative z-10">
          <Link
            to="/search"
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40 hover:text-primary transition-all mb-12"
          >
            <ArrowLeft className="h-4 w-4" /> Go Back
          </Link>

          <div className="grid gap-16 lg:grid-cols-12 items-start">
            {/* Image Section */}
            <div className="lg:col-span-7 group relative">
              <div className="relative aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl border border-black/5 bg-black/[0.02]">
                <ProductImage
                  src={product.images[0]}
                  alt={product.title}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />

                {/* Floating details overlay on image for edge */}
                <div className="absolute top-10 right-10 flex flex-col items-end gap-2">
                  <div className="glass px-4 py-2 rounded-full">
                    <span className="text-[10px] font-black tracking-widest uppercase">
                      925 Sterling
                    </span>
                  </div>
                  <div className="glass px-4 py-2 rounded-full">
                    <span className="text-[10px] font-black tracking-widest uppercase">
                      {product.style}
                    </span>
                  </div>
                </div>
              </div>

              {/* Optional thumbnails - simplified as artistic strip */}
              {product.images.length > 1 && (
                <div className="flex gap-4 mt-8 px-4 overflow-x-auto pb-4 no-scrollbar">
                  {product.images.map((img, i) => (
                    <div
                      key={i}
                      className="shrink-0 w-24 h-24 rounded-2xl overflow-hidden border border-black/10 hover:border-primary transition-colors cursor-pointer bg-black/[0.02]"
                    >
                      <img
                        src={img}
                        className="w-full h-full object-cover"
                        alt={`${product.title} ${i}`}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info Section */}
            <div className="lg:col-span-5 pt-8 lg:pt-20">
              <div className="flex flex-col gap-8">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full mb-6">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                      {product.inStock ? "Available to Order" : "Sold Out"}
                    </span>
                  </div>

                  <h1 className="font-display text-5xl md:text-7xl font-black tracking-tighter text-foreground leading-none mb-6">
                    {product.title}
                  </h1>

                  <div className="flex items-end gap-4">
                    <span className="text-4xl font-black text-foreground leading-none">
                      ${product.price}
                    </span>
                    {product.compareAtPrice && (
                      <span className="text-xl text-foreground/30 line-through font-light decoration-primary decoration-2 decoration-slice">
                        ${product.compareAtPrice}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <p className="text-lg text-foreground/60 leading-relaxed font-light">
                    {product.description}
                  </p>

                  <div className="flex flex-wrap gap-3">
                    {product.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-black uppercase tracking-widest text-primary italic"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-4 pt-10 border-t border-black/5">
                  <div className="flex gap-4">
                    <Button
                      size="lg"
                      className="flex-1 h-20 rounded-full bg-black text-white hover:bg-primary hover:text-white transition-all duration-500 font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-black/10"
                      onClick={handleAddToCart}
                      disabled={!product.inStock}
                    >
                      {product.inStock ? "Add to Collection" : "Join Waitlist"}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className={`h-20 w-20 rounded-full border-black/10 hover:bg-black/5 transition-all ${wishlisted ? "bg-primary/10 border-primary/20 text-primary" : ""}`}
                      onClick={handleWishlist}
                    >
                      <Heart
                        className={`h-6 w-6 ${wishlisted ? "fill-primary" : ""}`}
                      />
                    </Button>
                  </div>
                  <p className="text-center text-[10px] text-foreground/30 font-black uppercase tracking-widest">
                    Free Shipping from Bali on all orders above $150
                  </p>
                </div>

                {/* Material info list */}
                <div className="grid grid-cols-2 gap-4 mt-auto pt-12">
                  <div className="glass p-6 rounded-3xl">
                    <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest mb-1">
                      Material
                    </p>
                    <p className="font-black text-sm uppercase text-foreground">
                      {product.material}
                    </p>
                  </div>
                  <div className="glass p-6 rounded-3xl">
                    <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest mb-1">
                      Hand-finished
                    </p>
                    <p className="font-black text-sm uppercase text-foreground">
                      24h Polish
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetailPage;
