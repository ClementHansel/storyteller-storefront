// ============================================================
// Zenvix Webhook Handler Types (Stubbed)
// ============================================================
// In production, this runs as a Cloud edge function.
// For now, these types + handlers define the contract.
// ============================================================

import type { ZenvixWebhookPayload, ZenvixWebhookEventType } from '@/types/zenvix';
import { QueryClient } from '@tanstack/react-query';

type WebhookHandler = (data: Record<string, unknown>, queryClient: QueryClient) => void;

const handlers: Record<ZenvixWebhookEventType, WebhookHandler> = {
  'product.created': (_data, qc) => {
    qc.invalidateQueries({ queryKey: ['products'] });
  },
  'product.updated': (data, qc) => {
    qc.invalidateQueries({ queryKey: ['products'] });
    if (data.productId) {
      qc.invalidateQueries({ queryKey: ['product', data.productId] });
    }
  },
  'product.deleted': (data, qc) => {
    qc.invalidateQueries({ queryKey: ['products'] });
    if (data.productId) {
      qc.removeQueries({ queryKey: ['product', data.productId] });
    }
  },
  'inventory.changed': (data, qc) => {
    qc.invalidateQueries({ queryKey: ['products'] });
    if (data.productId) {
      qc.invalidateQueries({ queryKey: ['product', data.productId] });
    }
  },
  'price.changed': (data, qc) => {
    qc.invalidateQueries({ queryKey: ['products'] });
    if (data.productId) {
      qc.invalidateQueries({ queryKey: ['product', data.productId] });
    }
  },
  'promo.updated': (_data, qc) => {
    qc.invalidateQueries({ queryKey: ['promotions'] });
    qc.invalidateQueries({ queryKey: ['products'] });
  },
  'category.updated': (_data, qc) => {
    qc.invalidateQueries({ queryKey: ['categories'] });
  },
};

/**
 * Process an incoming Zenvix webhook payload.
 * In production, called from an edge function endpoint.
 * In dev, can be called manually for testing.
 */
export function processWebhook(payload: ZenvixWebhookPayload, queryClient: QueryClient): void {
  const handler = handlers[payload.event];
  if (handler) {
    console.debug('[Zenvix Webhook] Processing:', payload.event);
    handler(payload.data, queryClient);
  } else {
    console.warn('[Zenvix Webhook] Unknown event:', payload.event);
  }
}

/**
 * Simulate a webhook event for testing (dev mode only).
 */
export function simulateWebhook(
  event: ZenvixWebhookEventType,
  data: Record<string, unknown>,
  queryClient: QueryClient,
): void {
  const payload: ZenvixWebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    tenantId: 'dev',
    branchId: 'dev',
    data,
  };
  processWebhook(payload, queryClient);
}
