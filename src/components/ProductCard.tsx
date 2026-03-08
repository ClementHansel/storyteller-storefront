import { Link } from 'react-router-dom';
import { Product } from '@/types';
import { ProductImage } from './ProductImage';
import { Button } from './ui/button';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.info('Please sign in to add items to your cart', {
        action: { label: 'Sign In', onClick: () => window.location.href = '/login' },
      });
      return;
    }
    addItem(product);
  };

  return (
    <div className="group">
      <Link to={`/products/${product.id}`} className="block">
        <div className="relative overflow-hidden rounded-xl">
          <ProductImage
            src={product.images[0]}
            alt={product.title}
            className="transition-transform duration-700 group-hover:scale-105"
          />
          {/* Quick add overlay */}
          <div className="absolute inset-x-0 bottom-0 flex justify-center gap-2 p-4 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            <Button
              size="sm"
              className="rounded-full text-xs font-bold px-5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
              onClick={(e) => { e.preventDefault(); handleAddToCart(); }}
              disabled={!product.inStock}
            >
              <ShoppingBag className="h-3.5 w-3.5 mr-1.5" />
              {product.inStock ? 'Add to Bag' : 'Sold Out'}
            </Button>
          </div>
          {product.compareAtPrice && (
            <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
              Sale
            </span>
          )}
        </div>
        <div className="mt-4 space-y-1">
          <h3 className="font-display text-base font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
            {product.title}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">${product.price}</span>
            {product.compareAtPrice && (
              <span className="text-xs text-muted-foreground line-through">${product.compareAtPrice}</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
