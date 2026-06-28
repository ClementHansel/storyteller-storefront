// ============================================================
// Zenvix Order Sync — Comprehensive Order Creation & Sync Service
// ============================================================
// Handles direct Zenvix API calls for order creation, retry queue
// management with exponential backoff, and order_id persistence.
// Separate from `src/lib/zenvix-order-sync.ts` which handles
// event forwarding via trackEvent.
// ============================================================

import type { OrderRecord, OrderStage, SyncQueueEntry, SyncQueueEntryStatus } from '@/types/order';
import { getZenvixApiUrl, getZenvixChannelRecordId } from '@/config/runtime-env';
import { getZenvixConfig, isZenvixConfigured } from '@/api/zenvix-config';
import { toZenvixStatus } from '@/api/zenvix-stage-mapping';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SYNC_QUEUE_KEY = 'zenvix_order_sync_queue';
const ORDERS_STORAGE_KEY = 'bambu_whatsapp_orders';
const BASE_DELAY_MS = 2000;
const MAX_RETRIES = 5;

// ---------------------------------------------------------------------------
// Exponential Backoff
// ---------------------------------------------------------------------------

/**
 * Calculates the delay for a retry attempt using exponential backoff.
 * Returns baseDelay × 2^retries.
 */
export function calculateBackoffDelay(retries: number, baseDelay = BASE_DELAY_MS): number {
  return baseDelay * Math.pow(2, retries);
}

// ---------------------------------------------------------------------------
// UUID Generation
// ---------------------------------------------------------------------------

function generateUUID(): string {
  // Use crypto.randomUUID if available, otherwise fall back
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback UUID v4 generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ---------------------------------------------------------------------------
// Sync Queue Management
// ---------------------------------------------------------------------------

function loadSyncQueue(): SyncQueueEntry[] {
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSyncQueue(queue: SyncQueueEntry[]): void {
  try {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch {
    console.warn('[Zenvix Order Sync] Failed to persist sync queue to localStorage.');
  }
}

function addToSyncQueue(entry: Omit<SyncQueueEntry, 'id' | 'createdAt'>): void {
  const queue = loadSyncQueue();
  queue.push({
    ...entry,
    id: generateUUID(),
    createdAt: new Date().toISOString(),
  });
  saveSyncQueue(queue);
}

function updateQueueEntryStatus(entryId: string, status: SyncQueueEntryStatus, retries?: number): void {
  const queue = loadSyncQueue();
  const entry = queue.find((e) => e.id === entryId);
  if (entry) {
    entry.status = status;
    if (retries !== undefined) {
      entry.retries = retries;
    }
    saveSyncQueue(queue);
  }
}

// ---------------------------------------------------------------------------
// Order localStorage helpers
// ---------------------------------------------------------------------------

interface PersistedOrderData {
  orders: OrderRecord[];
  version: number;
}

function loadOrders(): PersistedOrderData {
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (!raw) return { orders: [], version: 1 };
    return JSON.parse(raw) as PersistedOrderData;
  } catch {
    return { orders: [], version: 1 };
  }
}

function persistOrders(data: PersistedOrderData): void {
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(data));
  } catch {
    console.warn('[Zenvix Order Sync] Failed to persist orders to localStorage.');
  }
}

function updateOrderInStorage(orderId: string, updates: Partial<OrderRecord>): void {
  const store = loadOrders();
  const index = store.orders.findIndex((o) => o.id === orderId);
  if (index !== -1) {
    store.orders[index] = { ...store.orders[index], ...updates };
    persistOrders(store);
  }
}

// ---------------------------------------------------------------------------
// API Helpers
// ---------------------------------------------------------------------------

function buildAuthHeaders(): Record<string, string> {
  const config = getZenvixConfig();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-tenant-id': config.tenantId,
    'x-client-id': config.clientId,
    'x-client-secret': config.clientSecret,
  };
  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }
  return headers;
}

function getOrdersEndpoint(): string {
  const baseUrl = getZenvixApiUrl().replace(/\/$/, '');
  return `${baseUrl}/orders`;
}

// ---------------------------------------------------------------------------
// Order Creation Payload Builder
// ---------------------------------------------------------------------------

export interface OrderCreationPayload {
  items: Array<{ sku: string; quantity: number }>;
  customer: { email: string; name: string };
  payment_status: 'PENDING';
  channel_record_id: string;
}

/**
 * Builds the POST payload for Zenvix order creation from a local OrderRecord.
 */
export function buildOrderCreationPayload(order: OrderRecord): OrderCreationPayload {
  return {
    items: order.items.map((item) => ({
      sku: item.productId,
      quantity: item.quantity,
    })),
    customer: {
      email: order.customerEmail,
      name: order.customerName,
    },
    payment_status: 'PENDING',
    channel_record_id: getZenvixChannelRecordId(),
  };
}

// ---------------------------------------------------------------------------
// Order Creation Sync
// ---------------------------------------------------------------------------

/**
 * Syncs an order creation to Zenvix API.
 *
 * - Generates and persists a traceId (UUID) on the order
 * - Builds the POST payload with items, customer info, payment_status, and channel_record_id
 * - On 2xx: stores the returned `order_id` as `zenvixOrderId`, sets syncStatus = 'synced'
 * - On 5xx/network error: queues for retry (exponential backoff, base 2s, max 5 attempts)
 * - On 4xx: does NOT retry, logs error, sets syncStatus = 'sync_failed'
 */
export async function syncOrderCreation(order: OrderRecord): Promise<void> {
  // Generate and persist traceId if not already set
  if (!order.traceId) {
    const traceId = generateUUID();
    order.traceId = traceId;
    updateOrderInStorage(order.id, { traceId, syncStatus: 'pending' });
  } else {
    updateOrderInStorage(order.id, { syncStatus: 'pending' });
  }

  // If Zenvix is not configured, queue for later retry
  if (!isZenvixConfigured()) {
    console.debug('[Zenvix Order Sync] Gateway not configured, queuing order creation.');
    queueOrderCreation(order);
    return;
  }

  const payload = buildOrderCreationPayload(order);
  const url = getOrdersEndpoint();
  const headers = buildAuthHeaders();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      // 2xx success
      const data = await response.json();
      const zenvixOrderId = data.order_id || data.id;

      updateOrderInStorage(order.id, {
        zenvixOrderId,
        syncStatus: 'synced',
      });
      return;
    }

    if (response.status >= 400 && response.status < 500) {
      // 4xx — do NOT retry, log and mark failed
      console.error(
        `[Zenvix Order Sync] 4xx error (${response.status}) creating order ${order.id}. Not retrying.`
      );
      updateOrderInStorage(order.id, { syncStatus: 'sync_failed' });
      return;
    }

    if (response.status >= 500) {
      // 5xx — queue for retry
      console.warn(
        `[Zenvix Order Sync] 5xx error (${response.status}) creating order ${order.id}. Queuing for retry.`
      );
      queueOrderCreation(order);
      return;
    }
  } catch (error) {
    // Network error — queue for retry
    console.warn('[Zenvix Order Sync] Network error creating order. Queuing for retry:', error);
    queueOrderCreation(order);
  }
}

/**
 * Queues an order creation for retry with exponential backoff.
 */
function queueOrderCreation(order: OrderRecord): void {
  const payload = buildOrderCreationPayload(order);
  addToSyncQueue({
    orderId: order.id,
    type: 'order_create',
    payload: payload as unknown as Record<string, unknown>,
    retries: 0,
    maxRetries: MAX_RETRIES,
    nextRetryAt: Date.now() + calculateBackoffDelay(0),
    status: 'pending',
    sequenceNumber: 0,
  });
}

// ---------------------------------------------------------------------------
// Stage Transition Sync
// ---------------------------------------------------------------------------

/** Sequence number storage key prefix (per order) */
const SEQUENCE_NUMBER_KEY_PREFIX = 'zenvix_seq_';

/**
 * Gets the next monotonically increasing sequence number for a given order.
 * Persisted in localStorage to survive page reloads.
 */
function getNextSequenceNumber(orderId: string): number {
  const key = `${SEQUENCE_NUMBER_KEY_PREFIX}${orderId}`;
  try {
    const current = localStorage.getItem(key);
    const next = current ? parseInt(current, 10) + 1 : 1;
    localStorage.setItem(key, String(next));
    return next;
  } catch {
    return 1;
  }
}

/**
 * Syncs a stage transition to Zenvix API.
 *
 * - Maps local stages to Zenvix status strings
 * - Builds payload with order_id (zenvixOrderId), from_stage, to_stage, timestamp
 * - Assigns a monotonically increasing sequenceNumber per order
 * - If zenvixOrderId is null, defers the transition until order creation completes
 * - On failure: queues for retry without blocking local state change
 *
 * This function is non-blocking — local state changes complete regardless of sync outcome.
 */
export async function syncStageTransition(
  orderId: string,
  fromStage: OrderStage,
  toStage: OrderStage,
): Promise<void> {
  const store = loadOrders();
  const order = store.orders.find((o) => o.id === orderId);

  if (!order) {
    console.warn(`[Zenvix Order Sync] Order ${orderId} not found in localStorage. Skipping stage transition sync.`);
    return;
  }

  const zenvixOrderId = order.zenvixOrderId ?? null;
  const sequenceNumber = getNextSequenceNumber(orderId);
  const timestamp = new Date().toISOString();

  const payload: Record<string, unknown> = {
    order_id: zenvixOrderId,
    from_stage: toZenvixStatus(fromStage),
    to_stage: toZenvixStatus(toStage),
    timestamp,
  };

  // If zenvixOrderId is not yet available, defer the transition
  if (!zenvixOrderId) {
    console.debug(
      `[Zenvix Order Sync] zenvixOrderId not available for order ${orderId}. Deferring stage transition.`
    );
    addToSyncQueue({
      orderId,
      type: 'stage_transition',
      payload,
      retries: 0,
      maxRetries: MAX_RETRIES,
      nextRetryAt: Date.now(),
      status: 'deferred',
      sequenceNumber,
    });
    return;
  }

  // If Zenvix is not configured, queue for later
  if (!isZenvixConfigured()) {
    console.debug('[Zenvix Order Sync] Gateway not configured, queuing stage transition.');
    addToSyncQueue({
      orderId,
      type: 'stage_transition',
      payload,
      retries: 0,
      maxRetries: MAX_RETRIES,
      nextRetryAt: Date.now() + calculateBackoffDelay(0),
      status: 'pending',
      sequenceNumber,
    });
    return;
  }

  // Attempt to send immediately
  const url = `${getOrdersEndpoint()}/${zenvixOrderId}/transitions`;
  const headers = buildAuthHeaders();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      // Transition synced successfully
      return;
    }

    // Non-2xx — queue for retry
    console.warn(
      `[Zenvix Order Sync] Error (${response.status}) syncing stage transition for order ${orderId}. Queuing for retry.`
    );
  } catch (error) {
    // Network error — queue for retry
    console.warn('[Zenvix Order Sync] Network error syncing stage transition. Queuing for retry:', error);
  }

  // Queue for retry on any failure
  addToSyncQueue({
    orderId,
    type: 'stage_transition',
    payload,
    retries: 0,
    maxRetries: MAX_RETRIES,
    nextRetryAt: Date.now() + calculateBackoffDelay(0),
    status: 'pending',
    sequenceNumber,
  });
}

// ---------------------------------------------------------------------------
// Events Endpoint Helper
// ---------------------------------------------------------------------------

function getEventsOrdersEndpoint(): string {
  const baseUrl = getZenvixApiUrl().replace(/\/$/, '');
  return `${baseUrl}/events/orders`;
}

// ---------------------------------------------------------------------------
// Quotation Recorded Sync
// ---------------------------------------------------------------------------

/**
 * Syncs a quotation recorded event to Zenvix API.
 *
 * - Looks up the order's zenvixOrderId from localStorage
 * - Builds payload: { order_id, delivery_cost, total, timestamp }
 * - POSTs to the events/orders endpoint
 * - On success: returns
 * - On failure: adds to sync queue with type 'quotation' for retry
 *
 * Requirements: 6.1, 6.3, 6.4, 6.5
 */
export async function syncQuotationRecorded(
  orderId: string,
  deliveryCost: number,
  total: number,
): Promise<void> {
  const store = loadOrders();
  const order = store.orders.find((o) => o.id === orderId);

  if (!order) {
    console.warn(`[Zenvix Order Sync] Order ${orderId} not found in localStorage. Skipping quotation sync.`);
    return;
  }

  const zenvixOrderId = order.zenvixOrderId ?? null;

  const payload: Record<string, unknown> = {
    order_id: zenvixOrderId,
    delivery_cost: deliveryCost,
    total,
    timestamp: new Date().toISOString(),
  };

  // If zenvixOrderId is not available, queue for later
  if (!zenvixOrderId) {
    console.debug(
      `[Zenvix Order Sync] zenvixOrderId not available for order ${orderId}. Queuing quotation event.`
    );
    addToSyncQueue({
      orderId,
      type: 'quotation',
      payload,
      retries: 0,
      maxRetries: MAX_RETRIES,
      nextRetryAt: Date.now() + calculateBackoffDelay(0),
      status: 'pending',
      sequenceNumber: 0,
    });
    return;
  }

  // If Zenvix is not configured, queue for later
  if (!isZenvixConfigured()) {
    console.debug('[Zenvix Order Sync] Gateway not configured, queuing quotation event.');
    addToSyncQueue({
      orderId,
      type: 'quotation',
      payload,
      retries: 0,
      maxRetries: MAX_RETRIES,
      nextRetryAt: Date.now() + calculateBackoffDelay(0),
      status: 'pending',
      sequenceNumber: 0,
    });
    return;
  }

  // Attempt to send immediately
  const url = getEventsOrdersEndpoint();
  const headers = buildAuthHeaders();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ event_type: 'order.quotation_recorded', ...payload }),
    });

    if (response.ok) {
      return;
    }

    // Non-2xx — queue for retry
    console.warn(
      `[Zenvix Order Sync] Error (${response.status}) syncing quotation event for order ${orderId}. Queuing for retry.`
    );
  } catch (error) {
    console.warn('[Zenvix Order Sync] Network error syncing quotation event. Queuing for retry:', error);
  }

  // Queue for retry on any failure
  addToSyncQueue({
    orderId,
    type: 'quotation',
    payload,
    retries: 0,
    maxRetries: MAX_RETRIES,
    nextRetryAt: Date.now() + calculateBackoffDelay(0),
    status: 'pending',
    sequenceNumber: 0,
  });
}

// ---------------------------------------------------------------------------
// Payment Completed Sync
// ---------------------------------------------------------------------------

/**
 * Syncs a payment completed event to Zenvix API.
 *
 * - Looks up the order's zenvixOrderId from localStorage
 * - Builds payload: { order_id, amount, timestamp }
 * - POSTs to the events/orders endpoint
 * - On success: returns
 * - On failure: adds to sync queue with type 'payment' for retry
 *
 * Requirements: 6.2, 6.3, 6.4, 6.5
 */
export async function syncPaymentCompleted(
  orderId: string,
  amount: number,
): Promise<void> {
  const store = loadOrders();
  const order = store.orders.find((o) => o.id === orderId);

  if (!order) {
    console.warn(`[Zenvix Order Sync] Order ${orderId} not found in localStorage. Skipping payment sync.`);
    return;
  }

  const zenvixOrderId = order.zenvixOrderId ?? null;

  const payload: Record<string, unknown> = {
    order_id: zenvixOrderId,
    amount,
    timestamp: new Date().toISOString(),
  };

  // If zenvixOrderId is not available, queue for later
  if (!zenvixOrderId) {
    console.debug(
      `[Zenvix Order Sync] zenvixOrderId not available for order ${orderId}. Queuing payment event.`
    );
    addToSyncQueue({
      orderId,
      type: 'payment',
      payload,
      retries: 0,
      maxRetries: MAX_RETRIES,
      nextRetryAt: Date.now() + calculateBackoffDelay(0),
      status: 'pending',
      sequenceNumber: 0,
    });
    return;
  }

  // If Zenvix is not configured, queue for later
  if (!isZenvixConfigured()) {
    console.debug('[Zenvix Order Sync] Gateway not configured, queuing payment event.');
    addToSyncQueue({
      orderId,
      type: 'payment',
      payload,
      retries: 0,
      maxRetries: MAX_RETRIES,
      nextRetryAt: Date.now() + calculateBackoffDelay(0),
      status: 'pending',
      sequenceNumber: 0,
    });
    return;
  }

  // Attempt to send immediately
  const url = getEventsOrdersEndpoint();
  const headers = buildAuthHeaders();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ event_type: 'payment.completed', ...payload }),
    });

    if (response.ok) {
      return;
    }

    // Non-2xx — queue for retry
    console.warn(
      `[Zenvix Order Sync] Error (${response.status}) syncing payment event for order ${orderId}. Queuing for retry.`
    );
  } catch (error) {
    console.warn('[Zenvix Order Sync] Network error syncing payment event. Queuing for retry:', error);
  }

  // Queue for retry on any failure
  addToSyncQueue({
    orderId,
    type: 'payment',
    payload,
    retries: 0,
    maxRetries: MAX_RETRIES,
    nextRetryAt: Date.now() + calculateBackoffDelay(0),
    status: 'pending',
    sequenceNumber: 0,
  });
}

// ---------------------------------------------------------------------------
// Sales Completion Sync
// ---------------------------------------------------------------------------

/**
 * Syncs a sales completion event to Zenvix API.
 *
 * - Checks the salesEventSent flag first; if true, returns immediately (idempotency guard)
 * - Builds payload with items (product_id, quantity, unit_price), total paid amount
 *   (including delivery cost), customer data (name, email), and channel_record_id
 * - POSTs to the events/orders endpoint
 * - On success: sets salesEventSent = true on the OrderRecord in localStorage
 * - On failure: queues for retry with type 'sales_complete' (max 5 retries)
 * - On exhaustion: marks as failed and logs order ID for manual reconciliation
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */
export async function syncSalesCompletion(order: OrderRecord): Promise<void> {
  // Idempotency guard: never send more than once per order
  if (order.salesEventSent) {
    return;
  }

  const payload: Record<string, unknown> = {
    event_type: 'sales.completion',
    items: order.items.map((item) => ({
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
    })),
    total: (order.paidAmount || order.subtotal) + (order.quotedDeliveryCost || 0),
    customer: {
      name: order.customerName,
      email: order.customerEmail,
    },
    channel_record_id: getZenvixChannelRecordId(),
  };

  // If Zenvix is not configured, queue for later
  if (!isZenvixConfigured()) {
    console.debug('[Zenvix Order Sync] Gateway not configured, queuing sales completion event.');
    addToSyncQueue({
      orderId: order.id,
      type: 'sales_complete',
      payload,
      retries: 0,
      maxRetries: MAX_RETRIES,
      nextRetryAt: Date.now() + calculateBackoffDelay(0),
      status: 'pending',
      sequenceNumber: 0,
    });
    return;
  }

  // Attempt to send immediately
  const url = getEventsOrdersEndpoint();
  const headers = buildAuthHeaders();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      // Success: mark salesEventSent = true in localStorage
      updateOrderInStorage(order.id, { salesEventSent: true });
      return;
    }

    // Non-2xx — queue for retry
    console.warn(
      `[Zenvix Order Sync] Error (${response.status}) syncing sales completion for order ${order.id}. Queuing for retry.`
    );
  } catch (error) {
    console.warn('[Zenvix Order Sync] Network error syncing sales completion. Queuing for retry:', error);
  }

  // Queue for retry on any failure
  addToSyncQueue({
    orderId: order.id,
    type: 'sales_complete',
    payload,
    retries: 0,
    maxRetries: MAX_RETRIES,
    nextRetryAt: Date.now() + calculateBackoffDelay(0),
    status: 'pending',
    sequenceNumber: 0,
  });
}

// ---------------------------------------------------------------------------
// Sync Queue Processing
// ---------------------------------------------------------------------------

/**
 * Processes all pending sync queue entries that are due for retry.
 * Uses exponential backoff. On max retries exhausted, marks as 'failed'
 * and sets the corresponding order's syncStatus to 'sync_failed'.
 *
 * Stage transitions are processed per-order sequentially in FIFO order
 * (by sequenceNumber). A later transition for an order is not sent until
 * earlier ones have been sent or exhausted.
 *
 * Deferred transitions (where zenvixOrderId was not available) are checked
 * again — if the order now has a zenvixOrderId, they are promoted to 'pending'.
 */
export async function processSyncQueue(): Promise<void> {
  if (!isZenvixConfigured()) return;

  const queue = loadSyncQueue();
  const now = Date.now();
  let changed = false;

  // First pass: promote deferred entries whose orders now have a zenvixOrderId
  for (const entry of queue) {
    if (entry.status === 'deferred' && entry.type === 'stage_transition') {
      const store = loadOrders();
      const order = store.orders.find((o) => o.id === entry.orderId);
      if (order?.zenvixOrderId) {
        entry.status = 'pending';
        entry.nextRetryAt = now;
        // Update the payload with the now-available zenvixOrderId
        entry.payload.order_id = order.zenvixOrderId;
        changed = true;
      }
    }
  }

  // Determine the next eligible stage_transition per order (lowest sequenceNumber with status 'pending')
  const nextTransitionPerOrder = new Map<string, SyncQueueEntry>();
  for (const entry of queue) {
    if (entry.type === 'stage_transition' && entry.status === 'pending') {
      const existing = nextTransitionPerOrder.get(entry.orderId);
      if (!existing || entry.sequenceNumber < existing.sequenceNumber) {
        nextTransitionPerOrder.set(entry.orderId, entry);
      }
    }
  }

  for (const entry of queue) {
    if (entry.status !== 'pending') continue;
    if (entry.nextRetryAt > now) continue;

    if (entry.type === 'order_create') {
      changed = true;
      const success = await processOrderCreateEntry(entry);

      if (success) {
        entry.status = 'sent';
      } else {
        entry.retries += 1;
        if (entry.retries >= entry.maxRetries) {
          entry.status = 'failed';
          // Mark order as sync_failed
          updateOrderInStorage(entry.orderId, { syncStatus: 'sync_failed' });
        } else {
          entry.nextRetryAt = now + calculateBackoffDelay(entry.retries);
        }
      }
    } else if (entry.type === 'stage_transition') {
      // Only process if this is the next eligible transition for this order (FIFO)
      const nextForOrder = nextTransitionPerOrder.get(entry.orderId);
      if (!nextForOrder || nextForOrder.id !== entry.id) continue;

      changed = true;
      const success = await processStageTransitionEntry(entry);

      if (success) {
        entry.status = 'sent';
        // Remove from the map so next iteration can process the next transition
        nextTransitionPerOrder.delete(entry.orderId);
      } else {
        entry.retries += 1;
        if (entry.retries >= entry.maxRetries) {
          entry.status = 'failed';
          // Remove from map; next transition in sequence can now proceed
          nextTransitionPerOrder.delete(entry.orderId);
        } else {
          entry.nextRetryAt = now + calculateBackoffDelay(entry.retries);
        }
      }
    } else if (entry.type === 'quotation' || entry.type === 'payment') {
      changed = true;
      const success = await processEventEntry(entry);

      if (success) {
        entry.status = 'sent';
      } else {
        entry.retries += 1;
        if (entry.retries >= entry.maxRetries) {
          entry.status = 'failed';
        } else {
          entry.nextRetryAt = now + calculateBackoffDelay(entry.retries);
        }
      }
    } else if (entry.type === 'sales_complete') {
      changed = true;
      const success = await processSalesCompleteEntry(entry);

      if (success) {
        entry.status = 'sent';
        // Mark salesEventSent = true on the order in localStorage
        updateOrderInStorage(entry.orderId, { salesEventSent: true });
      } else {
        entry.retries += 1;
        if (entry.retries >= entry.maxRetries) {
          entry.status = 'failed';
          console.error(
            `[Zenvix Order Sync] Sales completion event exhausted retries for order ${entry.orderId}. Marked as failed.`
          );
        } else {
          entry.nextRetryAt = now + calculateBackoffDelay(entry.retries);
        }
      }
    }
  }

  if (changed) {
    // Keep pending/deferred entries; remove sent entries; retain failed entries for inspection
    saveSyncQueue(queue.filter((e) => e.status === 'pending' || e.status === 'failed' || e.status === 'deferred'));
  }
}

/**
 * Attempts to send a queued order creation entry to Zenvix.
 * Returns true on 2xx, false on 5xx/network error.
 * On 4xx, marks as failed immediately (returns false with status override).
 */
async function processOrderCreateEntry(entry: SyncQueueEntry): Promise<boolean> {
  const url = getOrdersEndpoint();
  const headers = buildAuthHeaders();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(entry.payload),
    });

    if (response.ok) {
      const data = await response.json();
      const zenvixOrderId = data.order_id || data.id;

      updateOrderInStorage(entry.orderId, {
        zenvixOrderId,
        syncStatus: 'synced',
      });
      return true;
    }

    if (response.status >= 400 && response.status < 500) {
      // 4xx — mark as failed immediately, do not retry
      console.error(
        `[Zenvix Order Sync] 4xx error (${response.status}) on retry for order ${entry.orderId}. Marking failed.`
      );
      entry.status = 'failed';
      entry.retries = entry.maxRetries; // Exhaust retries immediately
      updateOrderInStorage(entry.orderId, { syncStatus: 'sync_failed' });
      return true; // Return true to prevent further retry logic from overwriting status
    }

    // 5xx
    return false;
  } catch {
    // Network error
    return false;
  }
}

/**
 * Attempts to send a queued stage transition entry to Zenvix.
 * Returns true on 2xx, false on 5xx/network error.
 * On 4xx, marks as failed immediately.
 */
async function processStageTransitionEntry(entry: SyncQueueEntry): Promise<boolean> {
  const zenvixOrderId = entry.payload.order_id as string;
  if (!zenvixOrderId) {
    // Should not happen if promotions are handled correctly, but guard anyway
    console.warn(`[Zenvix Order Sync] No order_id in stage transition payload for entry ${entry.id}.`);
    return false;
  }

  const url = `${getOrdersEndpoint()}/${zenvixOrderId}/transitions`;
  const headers = buildAuthHeaders();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(entry.payload),
    });

    if (response.ok) {
      return true;
    }

    if (response.status >= 400 && response.status < 500) {
      // 4xx — mark as failed immediately, do not retry
      console.error(
        `[Zenvix Order Sync] 4xx error (${response.status}) on stage transition retry for order ${entry.orderId}. Marking failed.`
      );
      entry.status = 'failed';
      entry.retries = entry.maxRetries;
      return true; // Prevent further retry logic from overwriting status
    }

    // 5xx
    return false;
  } catch {
    // Network error
    return false;
  }
}

/**
 * Attempts to send a queued quotation or payment event entry to Zenvix.
 * Returns true on 2xx, false on 5xx/network error.
 * On 4xx, marks as failed immediately.
 */
async function processEventEntry(entry: SyncQueueEntry): Promise<boolean> {
  const url = getEventsOrdersEndpoint();
  const headers = buildAuthHeaders();

  const eventType = entry.type === 'quotation' ? 'order.quotation_recorded' : 'payment.completed';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ event_type: eventType, ...entry.payload }),
    });

    if (response.ok) {
      return true;
    }

    if (response.status >= 400 && response.status < 500) {
      // 4xx — mark as failed immediately, do not retry
      console.error(
        `[Zenvix Order Sync] 4xx error (${response.status}) on ${entry.type} event retry for order ${entry.orderId}. Marking failed.`
      );
      entry.status = 'failed';
      entry.retries = entry.maxRetries;
      return true; // Prevent further retry logic from overwriting status
    }

    // 5xx
    return false;
  } catch {
    // Network error
    return false;
  }
}

/**
 * Attempts to send a queued sales completion event entry to Zenvix.
 * Returns true on 2xx, false on 5xx/network error.
 * On 4xx, marks as failed immediately.
 */
async function processSalesCompleteEntry(entry: SyncQueueEntry): Promise<boolean> {
  const url = getEventsOrdersEndpoint();
  const headers = buildAuthHeaders();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(entry.payload),
    });

    if (response.ok) {
      return true;
    }

    if (response.status >= 400 && response.status < 500) {
      // 4xx — mark as failed immediately, do not retry
      console.error(
        `[Zenvix Order Sync] 4xx error (${response.status}) on sales_complete event retry for order ${entry.orderId}. Marking failed.`
      );
      entry.status = 'failed';
      entry.retries = entry.maxRetries;
      return true; // Prevent further retry logic from overwriting status
    }

    // 5xx
    return false;
  } catch {
    // Network error
    return false;
  }
}

// ---------------------------------------------------------------------------
// Queue Stats & Utilities
// ---------------------------------------------------------------------------

/** Get sync queue statistics */
export function getSyncQueueStats(): { pending: number; failed: number; total: number } {
  const queue = loadSyncQueue();
  return {
    pending: queue.filter((e) => e.status === 'pending').length,
    failed: queue.filter((e) => e.status === 'failed').length,
    total: queue.length,
  };
}

/** Get all failed queue entries (for admin inspection) */
export function getFailedSyncEntries(): SyncQueueEntry[] {
  return loadSyncQueue().filter((e) => e.status === 'failed');
}

/** Clear the sync queue */
export function clearSyncQueue(): void {
  localStorage.removeItem(SYNC_QUEUE_KEY);
}

/** Exported for testing — access to the queue key */
export const SYNC_QUEUE_STORAGE_KEY = SYNC_QUEUE_KEY;
