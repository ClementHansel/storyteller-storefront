import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ProductImage } from '@/components/ProductImage';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { Button } from '@/components/ui/button';
import { Product } from '@/types';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const WISHLIST_KEY = 'bambu_wishlist';

function loadWishlist(): Product[] {
  try { return JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]'); } catch { return []; }
}

function saveWishlist(items: Product[]): void {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
}

export function addToWishlist(product: Product): void {
  const items = loadWishlist();
  if (!items.find((p) => p.id === product.id)) { items.push(product); saveWishlist(items); }
}

export function removeFromWishlist(productId: string): void {
  saveWishlist(loadWishlist().filter((p) => p.id !== productId));
}

export function isInWishlist(productId: string): boolean {
  return loadWishlist().some((p) => p.id === productId);
}

const WishlistPage = () => {
  const [items, setItems] = useState<Product[]>(loadWishlist);
  const { addItem } = useCart();
  const { isAuthenticated, loginUrl } = useAuth();

  const handleRemove = useCallback((id: string) => {
    removeFromWishlist(id);
    setItems((prev) => prev.filter((p) => p.id !== id));
    toast.success('Removed from wishlist');
  }, []);

  const handleAddToCart = useCallback(
    (product: Product) => {
      if (!isAuthenticated) {
        toast.info('Please sign in to add items to your cart', {
          action: { label: 'Sign In', onClick: () => (window.location.href = loginUrl) },
        });
        return;
      }
      addItem(product);
    },
    [isAuthenticated, loginUrl, addItem],
  );

  useDocumentTitle('Wishlist — Bambu Silver by Estela');

  return (
    <Layout>
      <div className="container py-12 md:py-20">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Saved Items</p>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold text-foreground">Your Wishlist</h1>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20 space-y-6">
            <Heart className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">Your wishlist is empty.</p>
            <Link to="/search">
              <Button className="rounded-full font-bold uppercase tracking-widest text-xs">
                Browse Collection <ArrowRight className="ml-2 h-3 w-3" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((product) => (
              <div key={product.id} className="group rounded-2xl overflow-hidden border border-border bg-card hover:shadow-xl transition-shadow duration-300">
                <Link to={`/products/${product.id}`}>
                  <ProductImage src={product.images[0]} alt={product.title} aspectRatio="portrait" />
                </Link>
                <div className="p-4 space-y-2">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{product.material}</p>
                  <Link to={`/products/${product.id}`}>
                    <h3 className="font-display text-base font-bold text-foreground hover:text-primary transition-colors">
                      {product.title}
                    </h3>
                  </Link>
                  <p className="text-sm font-semibold text-foreground">${product.price}</p>
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      className="flex-1 rounded-full font-bold uppercase tracking-widest text-[10px]"
                      onClick={() => handleAddToCart(product)}
                      disabled={!product.inStock}
                    >
                      <ShoppingBag className="mr-1.5 h-3 w-3" />
                      {product.inStock ? 'Add to Bag' : 'Sold Out'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => handleRemove(product.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default WishlistPage;
