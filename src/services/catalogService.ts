// ============================================================
// Catalog Service — fetches from local proxy (SQLite-backed)
// ============================================================
// The proxy at :3025 serves pre-converted USD prices from a
// local SQLite database that syncs from Zenvix every 5 minutes.
// Responses are <50ms vs 27s from Zenvix directly.
// ============================================================

import Decimal from "decimal.js";
import { getEnv } from "@/config/runtime-env";

// Proxy URL — defaults to same host port 3025
function getProxyUrl(): string {
  // In production: http://150.109.15.108:3025
  // Use window location host to determine the base
  const envUrl = getEnv("VITE_PROXY_API_URL");
  if (envUrl) return envUrl.replace(/\/$/, "");

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    return `http://${host}:3025`;
  }
  return "http://localhost:3025";
}

export interface CatalogProduct {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: string;
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
  product_count?: number;
}

interface ProxyProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  priceIDR: number;
  currency: string;
  categoryId: string;
  categoryName: string;
  stockStatus: string;
  maxQuantity: number;
  inStock: boolean;
}

interface ProxyProductsResponse {
  products: ProxyProduct[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface ProxyCategory {
  id: string;
  name: string;
  slug: string;
  product_count: number;
}

// ---- API calls to proxy ----

async function proxyFetch<T>(path: string): Promise<T> {
  const baseUrl = getProxyUrl();
  const res = await fetch(`${baseUrl}${path}`, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`Proxy: ${res.status} ${res.statusText}`);
  return res.json();
}

function mapProxyProduct(p: ProxyProduct): CatalogProductNormalized {
  const price = new Decimal(p.price);
  return {
    id: p.id,
    title: p.name,
    slug: p.slug,
    description: "",
    currency: "USD",
    images: ["https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80"],
    tags: [p.categoryId].filter(Boolean),
    material: "",
    style: "",
    categoryIds: [p.categoryId].filter(Boolean),
    inStock: p.inStock,
    stockQuantity: p.maxQuantity,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    price,
    compareAtPrice: undefined,
    priceDisplay: `$${price.toFixed(2)}`,
    compareAtPriceDisplay: undefined,
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
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.pageSize) qs.set("pageSize", String(params.pageSize));
  if (params?.categoryId) qs.set("category", params.categoryId);
  if (params?.search) qs.set("search", params.search);
  const query = qs.toString();

  const data = await proxyFetch<ProxyProductsResponse>(
    `/api/products${query ? `?${query}` : ""}`
  );

  return {
    products: data.products.map(mapProxyProduct),
    total: data.total,
    page: data.page,
    pageSize: data.pageSize,
  };
}

export async function getProductById(
  slugOrId: string
): Promise<CatalogProductNormalized> {
  const safeId = encodeURIComponent(slugOrId);
  const product = await proxyFetch<ProxyProduct>(`/api/products/${safeId}`);
  return mapProxyProduct(product);
}

export async function getCategories(): Promise<CatalogCategory[]> {
  const categories = await proxyFetch<ProxyCategory[]>("/api/categories");
  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: "",
    sortOrder: 0,
    product_count: c.product_count,
  }));
}
