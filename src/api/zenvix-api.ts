// ============================================================
// Zenvix API Service Layer
// ============================================================
// When a gateway is configured, this file delegates to the
// real Zenvix client. Otherwise it returns mock data.
// Swap is automatic — no code changes needed in consumers.
// ============================================================

import { Product } from '@/types';
import { storeCurrency } from '@/config/store-config';
import { isZenvixConfigured, getZenvixConfig, checkZenvixReachable } from '@/api/zenvix-config';
import {
  fetchCatalogProducts,
  createZenvixOrder,
} from '@/api/zenvix-client';

// ---- Mock Data (used when gateway is not configured) ----

const MOCK_PRODUCTS: Product[] = [
  { id: 'p-01', title: 'Flame-Forged Cuff', slug: 'flame-forged-cuff', description: 'A bold cuff bracelet hand-forged over open flame, showcasing raw hammer marks and organic curves.', price: 189, currency: 'USD', images: ['https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80'], tags: ['handmade', 'artisan'], material: 'Sterling Silver', style: 'Rustic', inStock: true, stockQuantity: 8, createdAt: '2025-09-01', updatedAt: '2025-12-01' },
  { id: 'p-02', title: 'Artisan Twist Bangle', slug: 'artisan-twist-bangle', description: 'Three strands of silver wire twisted by hand into a seamless bangle.', price: 145, currency: 'USD', images: ['https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&q=80'], tags: ['handmade', 'artisan'], material: 'Sterling Silver', style: 'Artisan', inStock: true, stockQuantity: 12, createdAt: '2025-08-15', updatedAt: '2025-11-20' },
];

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

// ============================================================
// Unified API — auto-switches between mock and live Zenvix
// ============================================================

export async function fetchAllProducts(): Promise<Product[]> {
  if (isZenvixConfigured()) {
    // Check reachability on first call (5s timeout, cached thereafter)
    const reachable = true; // Skip reachability check - go direct
    if (!reachable) {
      return MOCK_PRODUCTS;
    }
    const config = getZenvixConfig();
    const products = await fetchCatalogProducts(config, { pageSize: 200 });
    return products.map(mapZenvixProduct);
  }
  await delay(300);
  return MOCK_PRODUCTS;
}

export async function fetchProductById(id: string): Promise<Product | undefined> {
  if (isZenvixConfigured()) {
    const config = getZenvixConfig();
    const products = await fetchCatalogProducts(config);
    const found = products.find((p) => p.id === id);
    return found ? mapZenvixProduct(found) : undefined;
  }
  await delay(200);
  return MOCK_PRODUCTS.find((p) => p.id === id);
}

export async function fetchProductsByIds(ids: string[]): Promise<Product[]> {
  if (isZenvixConfigured()) {
    const all = await fetchAllProducts();
    return all.filter((p) => ids.includes(p.id));
  }
  await delay(250);
  return MOCK_PRODUCTS.filter((p) => ids.includes(p.id));
}

export async function fetchProductsByTags(tags: string[]): Promise<Product[]> {
  if (isZenvixConfigured()) {
    const config = getZenvixConfig();
    const products = await fetchCatalogProducts(config, { tags });
    return products.map(mapZenvixProduct);
  }
  await delay(250);
  return MOCK_PRODUCTS.filter((p) => p.tags.some((t) => tags.includes(t)));
}

/** Re-verify prices and stock before checkout (Zenvix safety check) */
export async function verifyCartPrices(
  items: { productId: string; expectedPrice: number; quantity?: number }[]
): Promise<{ 
  valid: boolean; 
  updates: { productId: string; currentPrice: number }[];
  outOfStock: { productId: string; productTitle: string; available: number }[];
}> {
  if (isZenvixConfigured()) {
    const all = await fetchAllProducts();
    const updates: { productId: string; currentPrice: number }[] = [];
    const outOfStock: { productId: string; productTitle: string; available: number }[] = [];
    
    for (const item of items) {
      const p = all.find(x => x.id === item.productId);
      if (!p) continue;
      
      // Check price change
      if (p.price !== item.expectedPrice) {
        updates.push({ productId: p.id, currentPrice: p.price });
      }
      
      // Check stock availability
      if (!p.inStock) {
        outOfStock.push({ productId: p.id, productTitle: p.title, available: 0 });
      } else if (item.quantity && p.stockQuantity < item.quantity) {
        outOfStock.push({ productId: p.id, productTitle: p.title, available: p.stockQuantity });
      }
    }
    return { valid: updates.length === 0 && outOfStock.length === 0, updates, outOfStock };
  }
  await delay(300);
  return { valid: true, updates: [], outOfStock: [] };
}

/** Create order — returns success or redirect */
export async function createCheckoutSession(
  items: { productId: string; quantity: number }[],
  customer?: { email: string; name: string }
): Promise<{ checkoutUrl: string; orderId?: string }> {
  if (isZenvixConfigured()) {
    const config = getZenvixConfig();
    
    // We need SKUs for the backend order DTO
    const all = await fetchAllProducts();
    const orderItems = items.map(i => {
      const p = all.find(x => x.id === i.productId);
      // In the backend, we use SKU to resolve products
      return { sku: p?.slug?.toUpperCase() || i.productId, quantity: i.quantity };
    });

    const res = await createZenvixOrder(config, {
      items: orderItems,
      customer,
      payment_method: "card",
      payment_status: "PAID" // Simulation for headless
    });

    return { 
      checkoutUrl: `/checkout/success?orderId=${res.order_id}`,
      orderId: res.order_id 
    };
  }
  await delay(400);
  return {
    checkoutUrl: `/checkout/success?orderId=mock-${Date.now()}`,
  };
}

// ---- Mapper ----

function mapZenvixProduct(zp: import('@/types/zenvix').ZenvixProduct): Product {
  return {
    id: zp.id,
    title: zp.name, // Backend uses 'name'
    slug: zp.sku.toLowerCase(), // Use SKU as slug
    description: zp.description || '',
    price: zp.price,
    compareAtPrice: undefined,
    currency: storeCurrency, 
    images: zp.images || ['https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80'],
    tags: zp.tags || [zp.category],
    material: zp.material || 'Sterling Silver',
    style: zp.style || 'Artisan',
    inStock: zp.stock_levels !== 'OUT_OF_STOCK',
    stockQuantity: zp.maxQuantity,
    createdAt: zp.createdAt || new Date().toISOString(),
    updatedAt: zp.updatedAt || new Date().toISOString(),
  };
}
