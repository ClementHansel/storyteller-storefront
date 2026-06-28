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
  name: string;
  sku: string;
  price: number;
  stock_levels: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
  category: string;
  maxQuantity: number;
  // Optional fields that might be returned in detailed view
  description?: string;
  images?: string[];
  tags?: string[];
  material?: string;
  style?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ZenvixCategory {
  id: string;
  name: string;
  slug: string;
  children?: ZenvixCategory[];
}

export interface ZenvixPromotion {
  id: string;
  code: string;
  label: string;
  discountType: "PERCENT" | "FIXED";
  value: number;
  scope: "CATEGORY" | "GLOBAL";
}

// ---- Inventory ----

export interface ZenvixInventoryStatus {
  productId: string;
  sku: string;
  stockLevel: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
  quantity: number;
  reservedQuantity?: number;
  updatedAt: string;
}

// ---- Responses ----

export type CatalogProductsResponse = ZenvixProduct[];

export interface CatalogCategoriesResponse {
  categories: ZenvixCategory[];
}

export interface CatalogPromotionsResponse {
  promotions: ZenvixPromotion[];
}

export interface InventoryStatusResponse {
  inventory: ZenvixInventoryStatus[];
}

// ---- Checkout Validation ----

export interface ZenvixCheckoutValidation {
  valid: boolean;
  errors?: string[];
  priceChanges?: { productId: string; oldPrice: number; newPrice: number }[];
}

export interface ZenvixCheckoutSession {
  sessionId: string;
  checkoutUrl: string;
  expiresAt: string;
}

// ---- Webhooks ----

export type ZenvixWebhookEventType =
  | "product.created"
  | "product.updated"
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
  | "session.start"
  | "page.view"
  | "product.view"
  | "search.query"
  | "user.register"
  | "user.login"
  | "user.logout"
  | "wishlist.add"
  | "wishlist.remove"
  | "cart.add"
  | "cart.remove"
  | "cart.update"
  | "cart.checkout"
  | "checkout.start"
  | "payment.completed"
  | "order.placed"
  | "order.stage_transition"
  | "order.quotation_recorded"
  | "chat.initiated";


export interface ZenvixUserEvent {
  type: ZenvixUserEventType;
  actor: {
    id: string;
    type: "customer" | "guest";
    tenant_id: string;
    branch_id: string;
  };
  context: {
    channel_record_id: string;
  };
  timestamp: string;
  payload: Record<string, unknown>;
  audit?: {
    traceId?: string;
  };
}

// ---- Checkout / Orders ----

export interface ZenvixOrderRequest {
  items: {
    sku: string;
    quantity: number;
  }[];
  customer?: {
    email: string;
    name?: string;
  };
  payment_method: string;
  payment_status: "PENDING" | "PAID";
}

export interface ZenvixOrderResponse {
  order_id: string;
  status: string;
  reservationTimeout?: string;
  totals: {
    subtotal: number;
    tax: number;
    grand_total: number;
  };
  message: string;
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

