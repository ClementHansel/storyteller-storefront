// ============================================================
// Zenvix Catalog Service (no JWT required)
// ============================================================

import zenvixClient from "@/lib/zenvixClient";
import Decimal from "decimal.js";

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

export interface CatalogProductNormalized extends Omit<
  CatalogProduct,
  "price" | "compareAtPrice"
> {
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
  const price = new Decimal(p.price || "0");
  const compareAtPrice = p.compareAtPrice
    ? new Decimal(p.compareAtPrice)
    : undefined;
  return {
    ...p,
    price,
    compareAtPrice,
    priceDisplay: `$${price.toFixed(2)}`,
    compareAtPriceDisplay: compareAtPrice
      ? `$${compareAtPrice.toFixed(2)}`
      : undefined,
  };
}

/** Map raw Zenvix API product (flat array format) to CatalogProduct interface */
function mapRawProduct(raw: Record<string, unknown>): CatalogProduct {
  return {
    id: (raw.id as string) || "",
    title: (raw.name as string) || (raw.title as string) || "",
    slug: ((raw.sku as string) || "").toLowerCase().replace(/\s+/g, "-"),
    description: (raw.description as string) || "",
    price: String(raw.price ?? "0"),
    compareAtPrice: raw.compareAtPrice ? String(raw.compareAtPrice) : undefined,
    currency: (raw.currency as string) || "IDR",
    images: (raw.images as string[]) || ["https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80"],
    tags: (raw.tags as string[]) || [raw.category as string].filter(Boolean),
    material: (raw.material as string) || "",
    style: (raw.style as string) || "",
    categoryIds: [raw.category as string].filter(Boolean),
    inStock: raw.stock_levels !== "OUT_OF_STOCK",
    stockQuantity: (raw.maxQuantity as number) || 0,
    createdAt: (raw.createdAt as string) || new Date().toISOString(),
    updatedAt: (raw.updatedAt as string) || new Date().toISOString(),
  };
}

export async function getProducts(params?: {
  page?: number;
  pageSize?: number;
  tags?: string[];
  categoryId?: string;
  search?: string;
}): Promise<{
  products: CatalogProductNormalized[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const { data } = await zenvixClient.get<ProductsResponse | CatalogProduct[]>("products", {
    params,
  });

  // Handle both response formats:
  // - Paginated: { products: [...], total, page, pageSize }
  // - Plain array: [...]
  if (Array.isArray(data)) {
    const products = data.map(mapRawProduct).map(normalizeProduct);
    return {
      products,
      total: products.length,
      page: 1,
      pageSize: products.length,
    };
  }

  return {
    ...data,
    products: data.products.map(normalizeProduct),
  };
}

export async function getProductById(
  id: string,
): Promise<CatalogProductNormalized> {
  const safeId = encodeURIComponent(id);
  const { data } = await zenvixClient.get<CatalogProduct | Record<string, unknown>>(`products/${safeId}`);

  // Handle raw Zenvix format (flat object with 'name', 'sku', 'stock_levels')
  if ('stock_levels' in data || 'sku' in data) {
    return normalizeProduct(mapRawProduct(data as Record<string, unknown>));
  }

  return normalizeProduct(data as CatalogProduct);
}

export async function getCategories(): Promise<CatalogCategory[]> {
  const { data } = await zenvixClient.get<CategoriesResponse | CatalogCategory[]>("categories");

  // Handle both response formats:
  // - Wrapped: { categories: [...] }
  // - Plain array: [...]
  if (Array.isArray(data)) {
    return data.map(mapRawCategory);
  }

  return data.categories;
}

/** Map raw Zenvix category response to CatalogCategory interface */
function mapRawCategory(raw: Record<string, unknown>): CatalogCategory {
  return {
    id: (raw.id as string) || "",
    name: (raw.name as string) || "",
    slug: (raw.slug as string) || "",
    description: (raw.description as string) || "",
    parentId: raw.parentId as string | undefined,
    image: raw.image as string | undefined,
    sortOrder: (raw.sortOrder as number) || 0,
  };
}
