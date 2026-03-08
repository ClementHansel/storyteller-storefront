// ============================================================
// Zenvix Retail Gateway — API Client
// ============================================================

import type {
  ZenvixConfig,
  ZenvixHeaders,
  CatalogProductsResponse,
  CatalogCategoriesResponse,
  CatalogPromotionsResponse,
  InventoryStatusResponse,
  ZenvixCheckoutValidation,
  ZenvixCheckoutSession,
  ZenvixUserEvent,
} from "@/types/zenvix";

function buildHeaders(config: ZenvixConfig): ZenvixHeaders {
  const headers: ZenvixHeaders = {
    "x-tenant-id": config.tenantId,
    "x-client-id": config.clientId,
    "x-client-secret": config.clientSecret,
    "Content-Type": "application/json",
  };
  return headers;
}

async function zenvixFetch<T>(
  config: ZenvixConfig,
  path: string,
  init?: RequestInit,
): Promise<T> {
  // Sanitize path to prevent traversal
  const safePath = path.replace(/\.{2,}/g, "").replace(/\/+/g, "/");
  const baseUrl = config.gatewayUrl.replace(/\/$/, "");
  const url = `${baseUrl}${safePath}`;
  const headers = buildHeaders(config);

  const res = await fetch(url, {
    ...init,
    headers: { ...headers, ...(init?.headers as Record<string, string>) },
  });

  if (!res.ok) {
    // Return generic error to client — don't leak backend details
    throw new Error(`Request failed (${res.status})`);
  }

  return res.json() as Promise<T>;
}

// ---- Catalog ----

export function fetchCatalogProducts(
  config: ZenvixConfig,
  params?: { page?: number; pageSize?: number; tags?: string[] },
) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.pageSize) qs.set("pageSize", String(params.pageSize));
  if (params?.tags?.length) qs.set("tags", params.tags.join(","));
  const query = qs.toString();
  return zenvixFetch<CatalogProductsResponse>(
    config,
    `/catalog/products${query ? `?${query}` : ""}`,
  );
}

export function fetchCatalogCategories(config: ZenvixConfig) {
  return zenvixFetch<CatalogCategoriesResponse>(config, "/catalog/categories");
}

export function fetchCatalogPromotions(config: ZenvixConfig) {
  return zenvixFetch<CatalogPromotionsResponse>(config, "/catalog/promotions");
}

export function fetchInventoryStatus(
  config: ZenvixConfig,
  productIds?: string[],
) {
  const qs = productIds?.length ? `?productIds=${productIds.join(",")}` : "";
  return zenvixFetch<InventoryStatusResponse>(config, `/inventory/status${qs}`);
}

// ---- Checkout ----

export function validateCheckout(
  config: ZenvixConfig,
  items: { productId: string; quantity: number; expectedPrice: number }[],
) {
  return zenvixFetch<ZenvixCheckoutValidation>(config, "/checkout/validate", {
    method: "POST",
    body: JSON.stringify({ items }),
  });
}

export function createZenvixCheckoutSession(
  config: ZenvixConfig,
  items: { productId: string; quantity: number }[],
) {
  return zenvixFetch<ZenvixCheckoutSession>(config, "/checkout/session", {
    method: "POST",
    body: JSON.stringify({ items }),
  });
}

// ---- Event Forwarding ----

export function sendUserEvent(config: ZenvixConfig, event: ZenvixUserEvent) {
  return zenvixFetch<{ ok: true }>(config, `/events/${event.eventType}`, {
    method: "POST",
    body: JSON.stringify(event),
  });
}
