import { Link, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { CheckCircle, ShoppingBag, ArrowRight } from "lucide-react";

const OrderConfirmationPage = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId") || "—";
  const total = searchParams.get("total") || "";

  return (
    <Layout>
      <SEO
        title="Order Confirmed"
        description="Your order has been placed successfully. Thank you for shopping with Bambu Silver."
        noIndex={true}
        url="/order-confirmation"
      />
      <div className="container min-h-screen flex items-center justify-center pt-32 pb-20">
        <div className="max-w-lg w-full text-center space-y-8">
          {/* Success Icon */}
          <div className="mx-auto w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle className="h-12 w-12 text-primary" />
          </div>

          {/* Heading */}
          <div className="space-y-3">
            <h1 className="font-display text-4xl md:text-5xl font-black text-foreground tracking-tighter uppercase leading-none">
              ORDER <span className="text-primary italic">CONFIRMED.</span>
            </h1>
            <p className="text-muted-foreground text-sm">
              Thank you for your purchase! Your handcrafted silver jewelry is being prepared with care.
            </p>
          </div>

          {/* Order Details */}
          <div className="rounded-3xl border border-border bg-muted/20 p-8 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40">Order ID</span>
              <span className="text-sm font-black text-foreground font-mono">{orderId}</span>
            </div>
            {total && (
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40">Total</span>
                <span className="text-lg font-black text-foreground">{total}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40">Status</span>
              <span className="text-xs font-black text-primary uppercase tracking-widest">Processing</span>
            </div>
          </div>

          {/* Info */}
          <p className="text-xs text-muted-foreground leading-relaxed">
            A confirmation email has been sent to your registered email address.
            You will receive shipping updates once your order is dispatched.
          </p>

          {/* Actions */}
          <div className="space-y-3 pt-4">
            <Button
              asChild
              className="w-full h-14 rounded-full bg-foreground text-background hover:bg-primary hover:text-primary-foreground transition-all font-black uppercase tracking-[0.2em] text-xs"
              size="lg"
            >
              <Link to="/chapters">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Continue Shopping
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full h-14 rounded-full font-black uppercase tracking-[0.2em] text-xs"
              size="lg"
            >
              <Link to="/">
                Back to Home
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Powered by */}
          <p className="text-[10px] text-foreground/20 font-black uppercase tracking-widest pt-4">
            Secure payment powered by Zenvix
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default OrderConfirmationPage;
