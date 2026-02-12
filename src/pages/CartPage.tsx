import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import { verifyCartPrices, createCheckoutSession } from '@/api/zenvix-api';
import { toast } from 'sonner';
import { useState } from 'react';

const CartPage = () => {
  const { items, updateQuantity, removeItem, clearCart, subtotal, itemCount } = useCart();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      // Re-verify prices against Zenvix
      const verification = await verifyCartPrices(
        items.map((i) => ({ productId: i.product.id, expectedPrice: i.product.price }))
      );

      if (!verification.valid) {
        toast.error('Some prices have changed. Please review your cart.');
        setLoading(false);
        return;
      }

      // Create checkout session
      const { checkoutUrl } = await createCheckoutSession(
        items.map((i) => ({ productId: i.product.id, quantity: i.quantity }))
      );

      // In mock mode, show toast. In production, redirect to checkoutUrl.
      toast.success(`Checkout session created! Redirect URL: ${checkoutUrl}`, { duration: 5000 });
      // window.location.href = checkoutUrl; // Uncomment for real Zenvix integration
    } catch {
      toast.error('Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <Layout>
        <title>Cart — Argentum & Craft</title>
        <div className="container py-20 text-center space-y-4">
          <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="font-serif text-2xl font-bold text-foreground">Your cart is empty</h1>
          <p className="text-muted-foreground">Discover our collections and find something special.</p>
          <Button asChild><Link to="/chapters">Explore Chapters</Link></Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <title>Cart ({itemCount}) — Argentum & Craft</title>

      <div className="container py-10 md:py-16">
        <h1 className="mb-8 font-serif text-3xl font-bold text-foreground">Your Cart</h1>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Items */}
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.product.id} className="flex gap-4 rounded-sm border border-border p-4">
                <img src={item.product.images[0]} alt={item.product.title} className="h-20 w-20 rounded-sm object-cover" />
                <div className="flex-1 min-w-0">
                  <Link to={`/products/${item.product.id}`} className="font-serif font-medium text-foreground hover:text-primary transition-colors">
                    {item.product.title}
                  </Link>
                  <p className="text-sm text-muted-foreground">${item.product.price} each</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto text-destructive" onClick={() => removeItem(item.product.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <p className="font-semibold text-foreground whitespace-nowrap">${(item.product.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="rounded-sm border border-border p-6 h-fit space-y-4">
            <h2 className="font-serif text-lg font-semibold text-foreground">Order Summary</h2>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal ({itemCount} items)</span>
              <span className="font-semibold text-foreground">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span className="text-muted-foreground">Calculated at checkout</span>
            </div>
            <div className="border-t border-border pt-4 flex justify-between">
              <span className="font-semibold text-foreground">Total</span>
              <span className="text-xl font-bold text-foreground">${subtotal.toFixed(2)}</span>
            </div>
            <Button className="w-full" size="lg" onClick={handleCheckout} disabled={loading}>
              {loading ? 'Verifying…' : 'Proceed to Checkout'} <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
            <p className="text-xs text-center text-muted-foreground">Prices verified against live inventory before checkout</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CartPage;
