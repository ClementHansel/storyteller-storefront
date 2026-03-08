import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import ChaptersPage from "./pages/ChaptersPage";
import ChapterDetailPage from "./pages/ChapterDetailPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import SearchPage from "./pages/SearchPage";
import CartPage from "./pages/CartPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminConfigPage from "./pages/AdminConfigPage";
import WishlistPage from "./pages/WishlistPage";
import ContactPage from "./pages/ContactPage";
import EcommerceHubPage from "./pages/EcommerceHubPage"; // Added import for EcommerceHubPage
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <div className="relative min-h-screen bg-mesh-gradient selection:bg-primary selection:text-primary-foreground">
            <div className="noise" />
            <Toaster />
            <Sonner position="top-center" expand={true} richColors />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/chapters" element={<ChaptersPage />} />
                <Route path="/chapters/:slug" element={<ChapterDetailPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/product/:slug" element={<ProductDetailPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/wishlist" element={<WishlistPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/hub" element={<EcommerceHubPage />} />
                <Route path="/admin/config" element={<AdminConfigPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </div>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
