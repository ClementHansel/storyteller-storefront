// ============================================================
// Zenvix Retail Gateway — Type Definitions
// ============================================================

// ---- Auth & Config ----

export interface ZenvixConfig {
  gatewayUrl: string;
  tenantId: string;
  clientId: string;
  clientSecret: string;
  apiKey?: string;
  branchId?: string;
  channel: "ecommerce";
}

export interface ZenvixHeaders {
  "x-tenant-id": string;
  "x-client-id": string;
  "x-client-secret": string;
  "Content-Type": "application/json";
  Authorization?: string;
}

// ---- Catalog ----

export interface ZenvixProduct {
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
  categoryIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ZenvixCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentId?: string;
  image?: string;
  sortOrder: number;
}

export interface ZenvixPromotion {
  id: string;
  name: string;
  type: "percentage" | "fixed" | "bogo" | "bundle";
  value: number;
  applicableProductIds?: string[];
  applicableCategoryIds?: string[];
  startsAt: string;
  endsAt: string;
  active: boolean;
}

export interface ZenvixInventoryStatus {
  productId: string;
  inStock: boolean;
  stockQuantity: number;
  reservedQuantity: number;
  updatedAt: string;
}

// ---- Catalog Responses ----

export interface CatalogProductsResponse {
  products: ZenvixProduct[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CatalogCategoriesResponse {
  categories: ZenvixCategory[];
}

export interface CatalogPromotionsResponse {
  promotions: ZenvixPromotion[];
}

export interface InventoryStatusResponse {
  inventory: ZenvixInventoryStatus[];
}

// ---- Webhook Events ----

export type ZenvixWebhookEventType =
  | "product.updated"
  | "product.created"
  | "product.deleted"
  | "inventory.changed"
  | "price.changed"
  | "promo.updated"
  | "category.updated";

export interface ZenvixWebhookPayload {
  event: ZenvixWebhookEventType;
  timestamp: string;
  tenantId: string;
  branchId: string;
  data: Record<string, unknown>;
}

// ---- User / Storefront Events ----

export type ZenvixUserEventType =
  | "user.register"
  | "user.login"
  | "user.logout"
  | "wishlist.add"
  | "wishlist.remove"
  | "cart.add"
  | "cart.remove"
  | "cart.update"
  | "checkout.start"
  | "payment.completed"
  | "order.placed";

export interface ZenvixUserEvent {
  tenantId: string;
  branchId: string;
  channel: "ecommerce";
  userId: string;
  timestamp: string;
  eventType: ZenvixUserEventType;
  payload: Record<string, unknown>;
}

// ---- Checkout ----

export interface ZenvixCheckoutValidation {
  valid: boolean;
  orderId?: string;
  errors?: string[];
  updates?: { productId: string; currentPrice: number }[];
}

export interface ZenvixCheckoutSession {
  checkoutUrl: string;
  sessionId: string;
  expiresAt: string;
}

// ---- Retry Queue ----

export interface QueuedEvent {
  id: string;
  event: ZenvixUserEvent;
  retries: number;
  maxRetries: number;
  nextRetryAt: number;
  status: "pending" | "failed" | "sent";
}
