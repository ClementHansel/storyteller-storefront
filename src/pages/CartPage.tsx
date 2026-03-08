import { Link, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { Button } from "@/components/ui/button";
import {
  Minus,
  Plus,
  Trash2,
  ArrowRight,
  ShoppingBag,
  Loader2,
} from "lucide-react";
import { checkout, type CheckoutPayload } from "@/services/orderService";
import { toast } from "sonner";
import { useState } from "react";

const CartPage = () => {
  const {
    items,
    updateQuantity,
    removeItem,
    subtotal,
    itemCount,
    isLoading: cartLoading,
  } = useCart();
  const { isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(false);
  useDocumentTitle(
    `Cart${itemCount > 0 ? ` (${itemCount})` : ""} — Bambu Silver by Estela`,
  );

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleCheckout = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const payload: CheckoutPayload = {
        customerName: user.name,
        customerEmail: user.email,
        customerPhone: user.phone || "",
        shippingAddress: "",
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          price: String(i.product.price),
        })),
        paymentMethod: "card",
      };
      const order = await checkout(payload);
      if (order.paymentUrl) {
        window.location.href = order.paymentUrl;
      } else {
        toast.success(
          `Order ${order.orderId} placed! Total: ${order.totalDisplay}`,
          { duration: 5000 },
        );
      }
    } catch (err: any) {
      toast.error(err?.message || "Checkout failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (cartLoading) {
    return (
      <Layout>
        <div className="container py-24 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container py-24 text-center space-y-6">
          <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h1 className="font-display text-3xl font-bold text-foreground">
            Your bag is empty
          </h1>
          <p className="text-sm text-muted-foreground">
            Discover our collections and find something bold.
          </p>
          <Button
            asChild
            className="rounded-full font-bold uppercase tracking-widest text-xs"
          >
            <Link to="/chapters">Explore Collections</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container min-h-screen pt-40 pb-20 w-full overflow-hidden">
        <h1 className="mb-16 font-display text-5xl md:text-7xl font-black text-foreground tracking-tighter uppercase leading-none">
          YOUR <br />
          <span className="text-primary italic font-black">BAG.</span>
        </h1>

        <div className="grid gap-16 lg:grid-cols-[1fr_400px]">
          <div className="space-y-8">
            {items.map((item) => (
              <div
                key={item.product.id}
                className="flex gap-6 border-b border-black/5 pb-8 group"
              >
                <div className="h-40 w-32 rounded-3xl overflow-hidden bg-black/[0.02] border border-black/5 shrink-0 shadow-lg group-hover:shadow-xl transition-shadow">
                  <img
                    src={item.product.images[0]}
                    alt={item.product.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between py-2">
                  <div>
                    <Link
                      to={`/product/${item.product.slug}`}
                      className="font-display text-xl md:text-2xl font-black text-foreground hover:text-primary transition-colors uppercase leading-none"
                    >
                      {item.product.title}
                    </Link>
                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mt-3 italic">
                      Bali Edition
                    </p>
                  </div>

                  <div className="mt-6 flex items-center gap-4">
                    <div className="flex items-center bg-black/[0.03] rounded-full p-1 border border-black/5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-full hover:bg-black/5"
                        onClick={() =>
                          updateQuantity(item.product.id, item.quantity - 1)
                        }
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-10 text-center text-xs font-black">
                        {item.quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-full hover:bg-black/5"
                        onClick={() =>
                          updateQuantity(item.product.id, item.quantity + 1)
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-foreground/20 hover:text-primary transition-colors"
                      onClick={() => removeItem(item.product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-right py-2">
                  <p className="text-xl font-black text-foreground whitespace-nowrap leading-none">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </p>
                  <p className="text-[10px] font-black text-foreground/20 mt-2 uppercase tracking-widest">
                    ${item.product.price} / PC
                  </p>
                </div>
              </div>
            ))}
          </div>

          <aside className="lg:sticky lg:top-32 h-fit">
            <div className="rounded-[2.5rem] border border-black/5 bg-muted/20 p-10 space-y-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[60px] translate-x-1/2 -translate-y-1/2" />

              <h2 className="font-display text-2xl font-black text-foreground uppercase tracking-tighter">
                THE SUMMARY
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                  <span className="text-foreground/40">
                    Subtotal ({itemCount})
                  </span>
                  <span className="text-foreground">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                  <span className="text-foreground/40">Origin</span>
                  <span className="text-foreground">BALI, ID</span>
                </div>
                <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                  <span className="text-foreground/40">Shipping</span>
                  <span className="text-primary italic">FREE</span>
                </div>
              </div>
              <div className="border-t border-black/5 pt-8 flex justify-between items-end">
                <span className="text-xs font-black text-foreground/40 uppercase tracking-widest">
                  GRAND TOTAL
                </span>
                <span className="text-4xl font-black text-foreground leading-none">
                  ${subtotal.toFixed(2)}
                </span>
              </div>
              <Button
                className="w-full h-16 rounded-full bg-black text-white hover:bg-primary hover:text-white transition-all font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-black/10"
                size="lg"
                onClick={handleCheckout}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "SECURE CHECKOUT"
                )}
              </Button>
              <div className="flex items-center justify-center gap-2 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
                <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center text-[10px] font-black">
                  Z
                </div>
                <p className="text-[10px] text-foreground tracking-widest uppercase font-black">
                  Powered by Zenvix
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
};

export default CartPage;
