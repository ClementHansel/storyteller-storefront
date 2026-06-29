import { Link, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { getAllOrders } from "@/lib/order-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Package, ArrowLeft, Mail, Phone } from "lucide-react";

const ProfilePage = () => {
  const { isAuthenticated, user, logout } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const orders = getAllOrders();
  const recentOrders = orders.slice(-5).reverse();

  return (
    <Layout>
      <SEO title="My Profile — Bambu Silver" description="Manage your account" />
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6 -ml-2">
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Home
          </Link>
        </Button>

        {/* Profile card */}
        <Card className="rounded-2xl border-border/50 mb-8">
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-2xl font-bold tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              My Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{user?.name || "Guest"}</span>
            </div>
            {user?.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{user.email}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent orders */}
        <Card className="rounded-2xl border-border/50 mb-8">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="font-display text-xl font-bold tracking-tight flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Recent Orders
              </CardTitle>
              <Link to="/order-status" className="text-xs font-bold text-primary hover:underline">
                View Latest →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No orders yet. Start shopping!
              </p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between py-3 px-4 rounded-xl bg-muted/50 border border-border/30"
                  >
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        #{order.id.slice(0, 8)}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">
                        {order.stage.replace(/_/g, " ")} · {order.items.length} items
                      </p>
                    </div>
                    <span className="text-xs font-bold text-primary">
                      ${order.subtotal.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Logout */}
        <Button
          onClick={logout}
          variant="outline"
          className="w-full rounded-full text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 font-bold"
        >
          Sign Out
        </Button>
      </div>
    </Layout>
  );
};

export default ProfilePage;
