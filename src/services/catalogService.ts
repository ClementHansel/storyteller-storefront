// ============================================================
// Zenvix Catalog Service (no JWT required)
// ============================================================

import zenvixClient from '@/lib/zenvixClient';
import Decimal from 'decimal.js';

export interface CatalogProduct {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: string; // Decimal string from API
  compareAtPrice?: string;
  currency: string;
  images: string[];
  tags: string[];
  material: string;
  style: string;
  categoryIds: string[];
  inStock: boolean;
  stockQuantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogProductNormalized extends Omit<CatalogProduct, 'price' | 'compareAtPrice'> {
  price: Decimal;
  compareAtPrice?: Decimal;
  priceDisplay: string;
  compareAtPriceDisplay?: string;
}

export interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentId?: string;
  image?: string;
  sortOrder: number;
}

export interface ProductsResponse {
  products: CatalogProduct[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CategoriesResponse {
  categories: CatalogCategory[];
}

/** Normalize raw product prices to Decimal instances */
function normalizeProduct(p: CatalogProduct): CatalogProductNormalized {
  const price = new Decimal(p.price || '0');
  const compareAtPrice = p.compareAtPrice ? new Decimal(p.compareAtPrice) : undefined;
  return {
    ...p,
    price,
    compareAtPrice,
    priceDisplay: `$${price.toFixed(2)}`,
    compareAtPriceDisplay: compareAtPrice ? `$${compareAtPrice.toFixed(2)}` : undefined,
  };
}

export async function getProducts(params?: {
  page?: number;
  pageSize?: number;
  tags?: string[];
  categoryId?: string;
  search?: string;
}): Promise<{ products: CatalogProductNormalized[]; total: number; page: number; pageSize: number }> {
  const { data } = await zenvixClient.get<ProductsResponse>('/products', { params });
  return {
    ...data,
    products: data.products.map(normalizeProduct),
  };
}

export async function getProductById(id: string): Promise<CatalogProductNormalized> {
  const safeId = encodeURIComponent(id);
  const { data } = await zenvixClient.get<CatalogProduct>(`/products/${safeId}`);
  return normalizeProduct(data);
}

export async function getCategories(): Promise<CatalogCategory[]> {
  const { data } = await zenvixClient.get<CategoriesResponse>('/categories');
  return data.categories;
}
