import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { useZenvixSession } from "@/hooks/use-zenvix-session";
import { lazy, Suspense } from "react";
import Index from "./pages/Index";

// Lazy-loaded pages for code-splitting
const ChaptersPage = lazy(() => import("./pages/ChaptersPage"));
const ChapterDetailPage = lazy(() => import("./pages/ChapterDetailPage"));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const CheckoutPage = lazy(() => import("./pages/WhatsAppCheckoutPage"));
const OrderStatusPage = lazy(() => import("./pages/OrderStatusPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const AdminConfigPage = lazy(() => import("./pages/AdminConfigPage"));
const AdminArticlesPage = lazy(() => import("./pages/AdminArticlesPage"));
const WishlistPage = lazy(() => import("./pages/WishlistPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const ShopDetailPage = lazy(() => import("./pages/ShopDetailPage"));
const EcommerceHubPage = lazy(() => import("./pages/EcommerceHubPage"));
const OrderConfirmationPage = lazy(() => import("./pages/OrderConfirmationPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

function AppInner() {
  useZenvixSession();

  return (
    <div className="relative min-h-screen bg-mesh-gradient selection:bg-primary selection:text-primary-foreground">
      <div className="noise" />
      <Toaster />
      <Sonner position="top-center" expand={true} richColors />
      <BrowserRouter>
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-pulse text-primary font-display text-xl">Loading...</div></div>}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/chapters" element={<ChaptersPage />} />
            <Route path="/chapters/:slug" element={<ChapterDetailPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/product/:slug" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
            <Route path="/order-status" element={<OrderStatusPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/shop/:slug" element={<ShopDetailPage />} />
            <Route path="/hub" element={<EcommerceHubPage />} />
            <Route path="/admin/config" element={<AdminConfigPage />} />
            <Route path="/admin/articles" element={<AdminArticlesPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <AppInner />
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
