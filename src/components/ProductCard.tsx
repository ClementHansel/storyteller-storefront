import { Link } from 'react-router-dom';
import { Product } from '@/types';
import { ProductImage } from './ProductImage';
import { Button } from './ui/button';
import { useCart } from '@/contexts/CartContext';
import { ShoppingBag } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();

  return (
    <div className="group animate-fade-in">
      <Link to={`/products/${product.id}`} className="block">
        <ProductImage
          src={product.images[0]}
          alt={product.title}
          className="rounded-sm transition-transform duration-300 group-hover:scale-[1.02]"
        />
        <div className="mt-3 space-y-1">
          <h3 className="font-serif text-lg font-medium leading-tight text-foreground group-hover:text-primary transition-colors">
            {product.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-base font-semibold text-foreground">${product.price}</span>
            {product.compareAtPrice && (
              <span className="text-sm text-muted-foreground line-through">${product.compareAtPrice}</span>
            )}
          </div>
        </div>
      </Link>
      <Button
        variant="outline"
        size="sm"
        className="mt-3 w-full opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => addItem(product)}
        disabled={!product.inStock}
      >
        <ShoppingBag className="h-4 w-4 mr-1" />
        {product.inStock ? 'Add to Cart' : 'Out of Stock'}
      </Button>
    </div>
  );
}
