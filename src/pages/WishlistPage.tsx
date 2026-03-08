import { useState, useCallback, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ProductImage } from '@/components/ProductImage';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { Button } from '@/components/ui/button';
import { Product } from '@/types';
import { Heart, ShoppingBag, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  getWishlist,
  addToWishlist as apiAddToWishlist,
  removeWishlistItem as apiRemoveWishlistItem,
  type WishlistItem,
} from '@/services/wishlistService';

// ---- Lightweight local helpers for unauthenticated fallback ----
const WISHLIST_KEY = 'bambu_wishlist';

function loadLocalWishlist(): Product[] {
  try { return JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]'); } catch { return []; }
}

function saveLocalWishlist(items: Product[]): void {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
}

// ---- Exported helpers (used by ProductDetailPage etc.) ----

export function addToWishlistLocal(product: Product): void {
  const items = loadLocalWishlist();
  if (!items.find((p) => p.id === product.id)) { items.push(product); saveLocalWishlist(items); }
}

export function removeFromWishlistLocal(productId: string): void {
  saveLocalWishlist(loadLocalWishlist().filter((p) => p.id !== productId));
}

export function isInWishlistLocal(productId: string): boolean {
  return loadLocalWishlist().some((p) => p.id === productId);
}

// Keep legacy named exports for existing imports
export const addToWishlist = addToWishlistLocal;
export const removeFromWishlist = removeFromWishlistLocal;
export const isInWishlist = isInWishlistLocal;

/** Map server wishlist item to Product shape */
function mapWishlistItem(wi: WishlistItem): Product {
  return {
    id: wi.productId,
    title: wi.productTitle,
    slug: '',
    description: '',
    price: parseFloat(wi.price) || 0,
    currency: 'USD',
    images: [wi.productImage],
    tags: [],
    material: '',
    style: '',
    inStock: true,
    stockQuantity: 99,
    createdAt: wi.addedAt,
    updatedAt: wi.addedAt,
  };
}

const WishlistPage = () => {
  const [items, setItems] = useState<Product[]>([]);
  const [serverIds, setServerIds] = useState<Map<string, string>>(new Map()); // productId -> server item id
  const [loading, setLoading] = useState(false);
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();

  // Load wishlist — from server when authenticated, otherwise local
  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      getWishlist()
        .then((res) => {
          setItems(res.items.map(mapWishlistItem));
          const idMap = new Map<string, string>();
          res.items.forEach((wi) => idMap.set(wi.productId, wi.id));
          setServerIds(idMap);
        })
        .catch(() => {
          // Fallback to local
          setItems(loadLocalWishlist());
        })
        .finally(() => setLoading(false));
    } else {
      setItems(loadLocalWishlist());
    }
  }, [isAuthenticated]);

  const handleRemove = useCallback(async (id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));

    if (isAuthenticated) {
      const serverId = serverIds.get(id);
      if (serverId) {
        try {
          const res = await apiRemoveWishlistItem(serverId);
          setItems(res.items.map(mapWishlistItem));
          const idMap = new Map<string, string>();
          res.items.forEach((wi) => idMap.set(wi.productId, wi.id));
          setServerIds(idMap);
        } catch { /* keep optimistic */ }
      }
    } else {
      removeFromWishlistLocal(id);
    }

    toast.success('Removed from wishlist');
  }, [isAuthenticated, serverIds]);

  const handleAddToCart = useCallback(
    (product: Product) => {
      if (!isAuthenticated) {
        toast.info('Please sign in to add items to your cart', {
          action: { label: 'Sign In', onClick: () => (window.location.href = '/login') },
        });
        return;
      }
      addItem(product);
    },
    [isAuthenticated, addItem],
  );

  useDocumentTitle('Wishlist — Bambu Silver by Estela');

  return (
    <Layout>
      <div className="container py-12 md:py-20">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Saved Items</p>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold text-foreground">Your Wishlist</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
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
