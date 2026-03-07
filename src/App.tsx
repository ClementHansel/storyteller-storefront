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
import AdminConfigPage from "./pages/AdminConfigPage";
import WishlistPage from "./pages/WishlistPage";
import ContactPage from "./pages/ContactPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/chapters" element={<ChaptersPage />} />
              <Route path="/chapters/:slug" element={<ChapterDetailPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/wishlist" element={<WishlistPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/admin/config" element={<AdminConfigPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
