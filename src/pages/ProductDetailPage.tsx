import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ProductImage } from '@/components/ProductImage';
import { useProduct } from '@/hooks/use-store';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading } = useProduct(id || '');
  const { addItem } = useCart();

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
          <h1 className="font-serif text-2xl text-foreground">Product not found</h1>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <title>{product.title} — Argentum & Craft</title>
      <meta name="description" content={product.description} />

      <div className="container py-8 md:py-14">
        <Link to="/chapters" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Chapters
        </Link>

        <div className="grid gap-10 md:grid-cols-2 mt-4">
          {/* Image */}
          <ProductImage src={product.images[0]} alt={product.title} aspectRatio="square" className="rounded-sm" />

          {/* Details */}
          <div className="flex flex-col justify-center space-y-5">
            <div>
              <h1 className="font-serif text-3xl font-bold text-foreground md:text-4xl">{product.title}</h1>
              <div className="mt-3 flex items-center gap-3">
                <span className="text-2xl font-bold text-foreground">${product.price}</span>
                {product.compareAtPrice && (
                  <span className="text-lg text-muted-foreground line-through">${product.compareAtPrice}</span>
                )}
              </div>
            </div>

            <p className="text-base text-muted-foreground leading-relaxed">{product.description}</p>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{product.material}</Badge>
              <Badge variant="secondary">{product.style}</Badge>
              {product.inStock ? (
                <Badge variant="outline">In Stock ({product.stockQuantity})</Badge>
              ) : (
                <Badge variant="destructive">Out of Stock</Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {product.tags.map((t) => (
                <span key={t} className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-sm">#{t}</span>
              ))}
            </div>

            <Button
              size="lg"
              className="w-full md:w-auto"
              onClick={() => addItem(product)}
              disabled={!product.inStock}
            >
              <ShoppingBag className="mr-2 h-5 w-5" />
              {product.inStock ? 'Add to Cart' : 'Out of Stock'}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetailPage;
