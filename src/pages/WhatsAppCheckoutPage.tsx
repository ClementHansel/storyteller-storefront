import { Navigate, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { CheckoutForm } from "@/components/CheckoutForm";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const WhatsAppCheckoutPage = () => {
  const { items, subtotal, itemCount, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect to cart if empty
  if (itemCount === 0) {
    return <Navigate to="/cart" replace />;
  }

  // Map cart items to the format expected by CheckoutForm
  const checkoutItems = items.map((item) => ({
    productId: item.product.id,
    title: item.product.title,
    quantity: item.quantity,
    unitPrice: item.product.price,
  }));

  function handleOrderCreated(orderId: string) {
    clearCart();
    navigate("/order-status");
  }

  return (
    <Layout>
      <SEO title="Checkout — Bambu Silver" description="Complete your order via WhatsApp" />
      <div className="container max-w-2xl mx-auto px-4 py-8">
        {/* Back to cart link */}
        <Button variant="ghost" asChild className="mb-6 -ml-2">
          <Link to="/cart">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Cart
          </Link>
        </Button>

        {/* Order summary header */}
        <div className="mb-6 flex items-center gap-2 text-muted-foreground">
          <ShoppingBag className="h-4 w-4" />
          <span className="text-sm">
            {itemCount} {itemCount === 1 ? "item" : "items"} · ${subtotal.toFixed(2)}
          </span>
        </div>

        {/* Checkout form */}
        <CheckoutForm
          items={checkoutItems}
          subtotal={subtotal}
          onOrderCreated={handleOrderCreated}
        />
      </div>
    </Layout>
  );
};

export default WhatsAppCheckoutPage;
