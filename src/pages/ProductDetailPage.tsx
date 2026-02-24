import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { ProductImage } from '@/components/ProductImage';
import { useProduct } from '@/hooks/use-store';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, ArrowLeft, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { addToWishlist, removeFromWishlist, isInWishlist } from '@/pages/WishlistPage';

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading } = useProduct(id || '');
  const { addItem } = useCart();
  const { isAuthenticated, loginUrl } = useAuth();

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.info('Please sign in to add items to your cart', {
        action: { label: 'Sign In', onClick: () => window.location.href = loginUrl },
      });
      return;
    }
    if (product) addItem(product);
  };

  const [wishlisted, setWishlisted] = useState(() => product ? isInWishlist(product.id) : false);

  const handleWishlist = () => {
    if (!product) return;
    if (wishlisted) {
      removeFromWishlist(product.id);
      setWishlisted(false);
      toast.success('Removed from wishlist');
    } else {
      addToWishlist(product);
      setWishlisted(true);
      toast.success('Added to wishlist');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-20 text-center text-muted-foreground">Loading…</div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="font-serif text-3xl font-light text-foreground">Product not found</h1>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 md:py-16">
        <Link to="/search" className="mb-8 inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3 w-3" /> Back to Shop
        </Link>

        <div className="grid gap-12 md:grid-cols-2 mt-6">
          {/* Image */}
          <div className="overflow-hidden">
            <ProductImage src={product.images[0]} alt={product.title} aspectRatio="portrait" />
          </div>

          {/* Details */}
          <div className="flex flex-col justify-center space-y-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-accent mb-2">{product.material}</p>
              <h1 className="font-serif text-4xl font-light text-foreground md:text-5xl leading-tight">{product.title}</h1>
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-2xl font-light text-foreground">${product.price}</span>
                {product.compareAtPrice && (
                  <span className="text-base text-muted-foreground line-through">${product.compareAtPrice}</span>
                )}
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed font-light">{product.description}</p>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="rounded-none text-[10px] uppercase tracking-wider">{product.style}</Badge>
              {product.inStock ? (
                <Badge variant="outline" className="rounded-none text-[10px] uppercase tracking-wider">In Stock ({product.stockQuantity})</Badge>
              ) : (
                <Badge variant="destructive" className="rounded-none text-[10px] uppercase tracking-wider">Sold Out</Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {product.tags.map((t) => (
                <span key={t} className="text-[10px] text-muted-foreground uppercase tracking-wider">#{t}</span>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                size="lg"
                className="flex-1 rounded-none uppercase tracking-widest text-xs"
                onClick={handleAddToCart}
                disabled={!product.inStock}
              >
                <ShoppingBag className="mr-2 h-4 w-4" />
                {product.inStock ? 'Add to Cart' : 'Sold Out'}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-none"
                onClick={handleWishlist}
              >
                <Heart className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetailPage;
