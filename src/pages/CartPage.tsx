import { Link, Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import { verifyCartPrices, createCheckoutSession } from '@/api/zenvix-api';
import { toast } from 'sonner';
import { useState } from 'react';

const CartPage = () => {
  const { items, updateQuantity, removeItem, clearCart, subtotal, itemCount } = useCart();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  useDocumentTitle(`Cart${itemCount > 0 ? ` (${itemCount})` : ''} — Bambu Silver by Estela`);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const verification = await verifyCartPrices(
        items.map((i) => ({ productId: i.product.id, expectedPrice: i.product.price }))
      );
      if (!verification.valid) {
        toast.error('Some prices have changed. Please review your cart.');
        setLoading(false);
        return;
      }
      const { checkoutUrl } = await createCheckoutSession(
        items.map((i) => ({ productId: i.product.id, quantity: i.quantity }))
      );
      toast.success(`Checkout session created! Redirect URL: ${checkoutUrl}`, { duration: 5000 });
    } catch {
      toast.error('Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container py-24 text-center space-y-6">
          <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h1 className="font-display text-3xl font-bold text-foreground">Your bag is empty</h1>
          <p className="text-sm text-muted-foreground">Discover our collections and find something bold.</p>
          <Button asChild className="rounded-full font-bold uppercase tracking-widest text-xs">
            <Link to="/chapters">Explore Collections</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-12 md:py-20">
        <h1 className="mb-10 font-display text-4xl font-extrabold text-foreground">Your Bag</h1>

        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.product.id} className="flex gap-5 border-b border-border pb-5">
                <img src={item.product.images[0]} alt={item.product.title} className="h-24 w-20 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <Link to={`/products/${item.product.id}`} className="font-display text-base font-bold text-foreground hover:text-primary transition-colors">
                    {item.product.title}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-1">${item.product.price} each</p>
                  <div className="mt-3 flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-7 w-7 rounded-full" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                    <Button variant="outline" size="icon" className="h-7 w-7 rounded-full" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto text-muted-foreground hover:text-destructive" onClick={() => removeItem(item.product.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm font-bold text-foreground whitespace-nowrap">${(item.product.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-card p-8 h-fit space-y-5">
            <h2 className="font-display text-xl font-bold text-foreground">Summary</h2>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal ({itemCount})</span>
              <span className="font-bold text-foreground">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span className="text-muted-foreground text-xs">At checkout</span>
            </div>
            <div className="border-t border-border pt-5 flex justify-between">
              <span className="text-sm font-bold text-foreground">Total</span>
              <span className="text-2xl font-extrabold text-foreground">${subtotal.toFixed(2)}</span>
            </div>
            <Button className="w-full rounded-full font-bold uppercase tracking-widest text-xs" size="lg" onClick={handleCheckout} disabled={loading}>
              {loading ? 'Verifying…' : 'Checkout'} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <p className="text-[10px] text-center text-muted-foreground tracking-wider uppercase font-bold">Prices verified before checkout</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CartPage;
