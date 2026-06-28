import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { OrderTracker } from "@/components/OrderTracker";
import { getLatestOrder } from "@/lib/order-store";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PackageSearch } from "lucide-react";

const OrderStatusPage = () => {
  const order = getLatestOrder();

  return (
    <Layout>
      <SEO title="Order Status — Bambu Silver" description="Track your order status" />
      <div className="container max-w-2xl mx-auto px-4 py-8">
        {/* Back to home link */}
        <Button variant="ghost" asChild className="mb-6 -ml-2">
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Home
          </Link>
        </Button>

        {order ? (
          <OrderTracker order={order} />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <PackageSearch className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="font-display text-xl font-bold tracking-tight mb-2">
              No Orders Found
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              You don't have any orders yet. Start shopping to place your first order.
            </p>
            <Button asChild className="rounded-full">
              <Link to="/chapters">Browse Collections</Link>
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default OrderStatusPage;
