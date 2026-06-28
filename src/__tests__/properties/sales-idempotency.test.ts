/**
 * Property 17: Sales event is sent at most once per order
 *
 * For any order where salesEventSent = true, calling the sales completion sync
 * function SHALL produce no new queue entries and SHALL NOT send any API request.
 *
 * **Validates: Requirements 8.5**
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import type { OrderRecord, OrderStage } from '@/types/order';

// Mock dependencies before importing the module under test
vi.mock('@/config/runtime-env', () => ({
  getZenvixApiUrl: () => 'http://localhost:3001/api/retail/public',
  getZenvixChannelRecordId: () => 'channel-123',
}));

vi.mock('@/api/zenvix-config', () => ({
  getZenvixConfig: () => ({
    tenantId: 'tenant-1',
    clientId: 'client-1',
    clientSecret: 'secret-1',
    apiKey: 'key-1',
  }),
  isZenvixConfigured: () => true,
}));

vi.mock('@/api/zenvix-stage-mapping', () => ({
  toZenvixStatus: (stage: string) => stage.toUpperCase(),
}));

import { syncSalesCompletion, SYNC_QUEUE_STORAGE_KEY } from '@/api/zenvix-order-sync';

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

const STAGES: OrderStage[] = [
  'Order_Submitted',
  'Quotation_Pending',
  'Quotation_Sent',
  'Payment_Pending',
  'Payment_Confirmed',
  'Complete',
];

const orderItemArb = fc.record({
  productId: fc.string({ minLength: 1, maxLength: 20 }),
  title: fc.string({ minLength: 1, maxLength: 50 }),
  quantity: fc.integer({ min: 1, max: 100 }),
  unitPrice: fc.integer({ min: 1, max: 100000 }),
});

// Safe ISO date string arbitrary that avoids Invalid Date issues
const isoDateArb = fc
  .integer({ min: 946684800000, max: 1924905600000 }) // 2000-01-01 to 2030-12-31
  .map((ts) => new Date(ts).toISOString());

/**
 * Generates a valid OrderRecord with salesEventSent = true.
 * This is the key invariant for Property 17 — the idempotency guard.
 */
const orderWithSalesEventSentArb: fc.Arbitrary<OrderRecord> = fc.record({
  id: fc.uuid(),
  stage: fc.constantFrom(...STAGES),
  customerName: fc.string({ minLength: 1, maxLength: 50 }),
  customerEmail: fc.emailAddress(),
  customerPhone: fc.string({ minLength: 5, maxLength: 15 }),
  shippingAddress: fc.string({ minLength: 5, maxLength: 100 }),
  items: fc.array(orderItemArb, { minLength: 1, maxLength: 5 }),
  subtotal: fc.integer({ min: 1, max: 1000000 }),
  quotedDeliveryCost: fc.option(fc.integer({ min: 0, max: 50000 }), { nil: undefined }),
  quotedTotal: fc.option(fc.integer({ min: 1, max: 1000000 }), { nil: undefined }),
  paidAmount: fc.option(fc.integer({ min: 1, max: 1000000 }), { nil: undefined }),
  userId: fc.option(fc.uuid(), { nil: undefined }),
  createdAt: isoDateArb,
  updatedAt: isoDateArb,
  stageHistory: fc.array(
    fc.record({
      stage: fc.constantFrom(...STAGES),
      timestamp: isoDateArb,
      source: fc.option(fc.constantFrom('local' as const, 'zenvix_admin' as const), { nil: undefined }),
    }),
    { minLength: 1, maxLength: 6 },
  ),
  zenvixOrderId: fc.option(fc.uuid(), { nil: undefined }),
  syncStatus: fc.option(fc.constantFrom('pending' as const, 'synced' as const, 'sync_failed' as const), { nil: undefined }),
  traceId: fc.option(fc.uuid(), { nil: undefined }),
  // The key property: salesEventSent is always true
  salesEventSent: fc.constant(true),
});

// ---------------------------------------------------------------------------
// Property Test
// ---------------------------------------------------------------------------

describe('Property 17: Sales event is sent at most once per order', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('syncSalesCompletion does NOT call fetch when salesEventSent = true', async () => {
    await fc.assert(
      fc.asyncProperty(orderWithSalesEventSentArb, async (order) => {
        // Setup: clear queue and mock fetch
        localStorage.removeItem(SYNC_QUEUE_STORAGE_KEY);
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
          new Response(JSON.stringify({ ok: true }), { status: 200 }),
        );

        // Act: attempt to sync sales completion
        await syncSalesCompletion(order);

        // Assert: fetch was never called (idempotency guard)
        expect(fetchSpy).not.toHaveBeenCalled();

        // Cleanup spy for next iteration
        fetchSpy.mockRestore();
      }),
      { numRuns: 100 },
    );
  });

  it('syncSalesCompletion does NOT add entries to the sync queue when salesEventSent = true', async () => {
    await fc.assert(
      fc.asyncProperty(orderWithSalesEventSentArb, async (order) => {
        // Setup: ensure empty queue
        localStorage.removeItem(SYNC_QUEUE_STORAGE_KEY);
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
          new Response(JSON.stringify({ ok: true }), { status: 200 }),
        );

        // Act
        await syncSalesCompletion(order);

        // Assert: no new entries in the sync queue
        const queueRaw = localStorage.getItem(SYNC_QUEUE_STORAGE_KEY);
        const queue = queueRaw ? JSON.parse(queueRaw) : [];
        expect(queue).toHaveLength(0);

        // Cleanup
        fetchSpy.mockRestore();
      }),
      { numRuns: 100 },
    );
  });
});
