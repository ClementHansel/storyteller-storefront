// Types for the Zenvix-compatible product system

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  images: string[];
  tags: string[];
  material: string;
  style: string;
  inStock: boolean;
  stockQuantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoryChapter {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  story: string; // 500-word SEO block
  coverImage: string;
  narrativeOrder: number;
  productIds?: string[];
  productTags?: string[];
  metaTitle: string;
  metaDescription: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  currency: string;
}

export type SortOption = 'price-asc' | 'price-desc' | 'narrative' | 'newest';

export interface FilterState {
  chapters: string[];       // Legacy — kept for backward compatibility
  categories: string[];     // Zenvix category UUIDs
  materials: string[];      // Legacy — no longer used
  styles: string[];         // Legacy — no longer used
  sort: SortOption;
  priceRange?: [number, number];
}
