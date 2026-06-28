import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { CartItem, Product } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { trackEvent } from '@/api/zenvix-events';
import { toast } from 'sonner';
import {
  getCart,
  addToCart as apiAddToCart,
  updateCartItem as apiUpdateCartItem,
  removeCartItem as apiRemoveCartItem,
  type CartNormalized,
  type CartItemNormalized,
} from '@/services/cartService';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

/** Map server cart items to local CartItem shape */
function mapServerItem(si: CartItemNormalized): CartItem {
  return {
    product: {
      id: si.productId,
      title: si.productTitle,
      slug: '',
      description: '',
      price: si.price.toNumber(),
      currency: 'USD',
      images: [si.productImage],
      tags: [],
      material: '',
      style: '',
      inStock: true,
      stockQuantity: 99,
      createdAt: '',
      updatedAt: '',
    },
    quantity: si.quantity,
  };
}

/** Map a server cart response to local items list */
function mapServerCart(cart: CartNormalized): CartItem[] {
  return cart.items.map(mapServerItem);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [serverItemIds, setServerItemIds] = useState<Map<string, string>>(new Map()); // productId -> server itemId
  const [isLoading, setIsLoading] = useState(false);

  // Sync cart from server when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setItems([]);
      setServerItemIds(new Map());
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    getCart()
      .then((cart) => {
        if (cancelled) return;
        setItems(mapServerCart(cart));
        const idMap = new Map<string, string>();
        cart.items.forEach((si) => idMap.set(si.productId, si.id));
        setServerItemIds(idMap);
      })
      .catch(() => {
        // Server cart unavailable — keep local state
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [isAuthenticated]);

  const addItem = useCallback(
    async (product: Product, quantity = 1) => {
      // Optimistic local update
      setItems((prev) => {
        const existing = prev.find((i) => i.product.id === product.id);
        if (existing) {
          return prev.map((i) =>
            i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
          );
        }
        return [...prev, { product, quantity }];
      });
      toast.success(`${product.title} added to cart`);

      // Track cart.add event
      trackEvent('cart.add', 'anonymous', {
        product_id: product.id,
        product_name: product.title,
        quantity,
        price: product.price,
      });

      if (isAuthenticated) {
        try {
          const cart = await apiAddToCart(product.id, quantity);
          setItems(mapServerCart(cart));
          const idMap = new Map<string, string>();
          cart.items.forEach((si) => idMap.set(si.productId, si.id));
          setServerItemIds(idMap);
        } catch {
          // Keep optimistic state — server sync will happen next load
        }
      }
    },
    [isAuthenticated]
  );

  const removeItem = useCallback(
    async (productId: string) => {
      const removedItem = items.find(i => i.product.id === productId);
      setItems((prev) => prev.filter((i) => i.product.id !== productId));

      // Track cart.remove event
      if (removedItem) {
        trackEvent('cart.remove', 'anonymous', {
          product_id: productId,
          product_name: removedItem.product.title,
          quantity: removedItem.quantity,
        });
      }

      if (isAuthenticated) {
        const serverId = serverItemIds.get(productId);
        if (serverId) {
          try {
            const cart = await apiRemoveCartItem(serverId);
            setItems(mapServerCart(cart));
            const idMap = new Map<string, string>();
            cart.items.forEach((si) => idMap.set(si.productId, si.id));
            setServerItemIds(idMap);
          } catch {
            // Keep optimistic removal
          }
        }
      }
    },
    [isAuthenticated, serverItemIds, items]
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(productId);
        return;
      }

      setItems((prev) =>
        prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i))
      );

      if (isAuthenticated) {
        const serverId = serverItemIds.get(productId);
        if (serverId) {
          try {
            const cart = await apiUpdateCartItem(serverId, quantity);
            setItems(mapServerCart(cart));
            const idMap = new Map<string, string>();
            cart.items.forEach((si) => idMap.set(si.productId, si.id));
            setServerItemIds(idMap);
          } catch {
            // Keep optimistic state
          }
        }
      }
    },
    [isAuthenticated, serverItemIds, removeItem]
  );

  const clearCart = useCallback(() => setItems([]), []);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotal, isLoading }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
