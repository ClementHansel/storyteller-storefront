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
  const { isAuthenticated } = useAuth();

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.info('Please sign in to add items to your cart', {
        action: { label: 'Sign In', onClick: () => window.location.href = '/login' },
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

  useDocumentTitle(product ? `${product.title} — Bambu Silver` : 'Product — Bambu Silver');

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
          <h1 className="font-display text-3xl font-bold text-foreground">Product not found</h1>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 md:py-16">
        <Link to="/search" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-3 w-3" /> Back to Shop
        </Link>

        <div className="grid gap-12 md:grid-cols-2 mt-6">
          {/* Image */}
          <div className="overflow-hidden rounded-2xl">
            <ProductImage src={product.images[0]} alt={product.title} aspectRatio="portrait" />
          </div>

          {/* Details */}
          <div className="flex flex-col justify-center space-y-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">{product.material}</p>
              <h1 className="font-display text-4xl font-extrabold text-foreground md:text-5xl leading-tight">{product.title}</h1>
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-3xl font-bold text-foreground">${product.price}</span>
                {product.compareAtPrice && (
                  <span className="text-base text-muted-foreground line-through">${product.compareAtPrice}</span>
                )}
              </div>
            </div>

            <p className="text-base text-muted-foreground leading-relaxed">{product.description}</p>

            <div className="flex flex-wrap gap-2">
              <Badge className="rounded-full text-xs font-bold bg-primary/10 text-primary border-0">{product.style}</Badge>
              {product.inStock ? (
                <Badge variant="outline" className="rounded-full text-xs font-bold">In Stock ({product.stockQuantity})</Badge>
              ) : (
                <Badge variant="destructive" className="rounded-full text-xs font-bold">Sold Out</Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {product.tags.map((t) => (
                <span key={t} className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">#{t}</span>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                size="lg"
                className="flex-1 rounded-full font-bold uppercase tracking-widest text-sm"
                onClick={handleAddToCart}
                disabled={!product.inStock}
              >
                <ShoppingBag className="mr-2 h-4 w-4" />
                {product.inStock ? 'Add to Bag' : 'Sold Out'}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className={`rounded-full ${wishlisted ? 'text-primary border-primary' : ''}`}
                onClick={handleWishlist}
              >
                <Heart className={`h-4 w-4 ${wishlisted ? 'fill-primary' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetailPage;
