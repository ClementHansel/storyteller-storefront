// ============================================================
// Zenvix Retail Gateway — API Client
// ============================================================
// This client sends real requests when a gateway is configured.
// All methods throw on network errors so callers can handle.
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
} from '@/types/zenvix';

function buildHeaders(config: ZenvixConfig): ZenvixHeaders {
  return {
    Authorization: `Bearer ${config.apiKey}`,
    'X-Zenvix-Tenant': config.tenantId,
    'X-Zenvix-Branch': config.branchId,
    'Content-Type': 'application/json',
  };
}

async function zenvixFetch<T>(config: ZenvixConfig, path: string, init?: RequestInit): Promise<T> {
  const url = `${config.gatewayUrl.replace(/\/$/, '')}${path}`;
  const headers = buildHeaders(config);

  const res = await fetch(url, {
    ...init,
    headers: { ...headers, ...(init?.headers as Record<string, string>) },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Zenvix API ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

// ---- Catalog ----

export function fetchCatalogProducts(config: ZenvixConfig, params?: { page?: number; pageSize?: number; tags?: string[] }) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.pageSize) qs.set('pageSize', String(params.pageSize));
  if (params?.tags?.length) qs.set('tags', params.tags.join(','));
  const query = qs.toString();
  return zenvixFetch<CatalogProductsResponse>(config, `/catalog/products${query ? `?${query}` : ''}`);
}

export function fetchCatalogCategories(config: ZenvixConfig) {
  return zenvixFetch<CatalogCategoriesResponse>(config, '/catalog/categories');
}

export function fetchCatalogPromotions(config: ZenvixConfig) {
  return zenvixFetch<CatalogPromotionsResponse>(config, '/catalog/promotions');
}

export function fetchInventoryStatus(config: ZenvixConfig, productIds?: string[]) {
  const qs = productIds?.length ? `?productIds=${productIds.join(',')}` : '';
  return zenvixFetch<InventoryStatusResponse>(config, `/inventory/status${qs}`);
}

// ---- Checkout ----

export function validateCheckout(
  config: ZenvixConfig,
  items: { productId: string; quantity: number; expectedPrice: number }[],
) {
  return zenvixFetch<ZenvixCheckoutValidation>(config, '/checkout/validate', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

export function createZenvixCheckoutSession(
  config: ZenvixConfig,
  items: { productId: string; quantity: number }[],
) {
  return zenvixFetch<ZenvixCheckoutSession>(config, '/checkout/session', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

// ---- Event Forwarding ----

export function sendUserEvent(config: ZenvixConfig, event: ZenvixUserEvent) {
  return zenvixFetch<{ ok: true }>(config, `/events/${event.eventType}`, {
    method: 'POST',
    body: JSON.stringify(event),
  });
}
