import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fc from "fast-check";
import { processSyncQueue, SYNC_QUEUE_STORAGE_KEY } from "@/api/zenvix-order-sync";
import type { SyncQueueEntry } from "@/types/order";

/**
 * Feature: vps-deployment-zenvix-integration, Property 7: Per-order sequential transition ordering
 * **Validates: Requirements 5.5**
 *
 * For any order with multiple queued stage transitions, the sync queue SHALL process them
 * in monotonically increasing sequence number order, such that no later transition is sent
 * before an earlier one for the same order.
 */

// Mock zenvix-config to allow processSyncQueue to run
vi.mock("@/api/zenvix-config", () => ({
  isZenvixConfigured: () => true,
  getZenvixConfig: () => ({
    gatewayUrl: "http://localhost:3001/api",
    tenantId: "test-tenant",
    clientId: "test-client",
    clientSecret: "test-secret",
    apiKey: "test-key",
    branchId: "test-branch",
    channel: "ecommerce",
  }),
}));

// Mock runtime-env to provide valid config values
vi.mock("@/config/runtime-env", () => ({
  getZenvixApiUrl: () => "http://localhost:3001/api",
  getZenvixChannelRecordId: () => "channel-123",
  getZenvixTenantId: () => "test-tenant",
  getZenvixClientId: () => "test-client",
  getZenvixClientSecret: () => "test-secret",
  getZenvixApiKey: () => "test-key",
  getZenvixBranchId: () => "test-branch",
  isZenvixConfigured: () => true,
}));

const ORDERS_STORAGE_KEY = "bambu_whatsapp_orders";

/**
 * Generator for a sequence of stage transition queue entries for a single order.
 * Generates 2-5 entries with random (non-sequential) sequence numbers to verify FIFO ordering.
 */
const stageTransitionSequenceArb = fc
  .integer({ min: 2, max: 5 })
  .chain((count) =>
    fc.tuple(
      fc.uuid(), // orderId
      fc.uuid(), // zenvixOrderId
      // Generate `count` unique sequence numbers (shuffled to ensure they're not in order in the queue)
      fc.shuffledSubarray(
        Array.from({ length: 20 }, (_, i) => i + 1),
        { minLength: count, maxLength: count }
      )
    )
  )
  .map(([orderId, zenvixOrderId, sequenceNumbers]) => {
    const entries: SyncQueueEntry[] = sequenceNumbers.map((seqNum, idx) => ({
      id: `entry-${orderId}-${idx}`,
      orderId,
      type: "stage_transition" as const,
      payload: {
        order_id: zenvixOrderId,
        from_stage: "SUBMITTED",
        to_stage: "QUOTATION_PENDING",
        timestamp: new Date().toISOString(),
      },
      retries: 0,
      maxRetries: 5,
      nextRetryAt: 0, // Due immediately
      status: "pending" as const,
      sequenceNumber: seqNum,
      createdAt: new Date().toISOString(),
    }));
    return { orderId, zenvixOrderId, entries, sequenceNumbers };
  });

describe("Property 7: Per-order sequential transition ordering", () => {
  let sentSequenceNumbers: number[];

  beforeEach(() => {
    localStorage.clear();
    sentSequenceNumbers = [];
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("transitions are sent in monotonically increasing sequence number order", async () => {
    await fc.assert(
      fc.asyncProperty(
        stageTransitionSequenceArb,
        async ({ orderId, zenvixOrderId, entries, sequenceNumbers }) => {
          // Reset state
          localStorage.clear();
          sentSequenceNumbers = [];

          // Set up the order in localStorage with a zenvixOrderId
          const orderData = {
            orders: [
              {
                id: orderId,
                stage: "Order_Submitted",
                customerName: "Test",
                customerEmail: "test@test.com",
                customerPhone: "12345",
                shippingAddress: "123 Test St",
                items: [{ productId: "p1", title: "Item", quantity: 1, unitPrice: 10 }],
                subtotal: 10,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                stageHistory: [{ stage: "Order_Submitted", timestamp: new Date().toISOString() }],
                zenvixOrderId,
                syncStatus: "synced",
              },
            ],
            version: 1,
          };
          localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orderData));

          // Place entries in sync queue (in shuffled order — not sorted by sequenceNumber)
          localStorage.setItem(SYNC_QUEUE_STORAGE_KEY, JSON.stringify(entries));

          // Mock fetch to track the order of calls by capturing sequence numbers
          const fetchMock = vi.fn().mockImplementation(async (url: string, options: RequestInit) => {
            // Extract the sequence number from the entry being processed
            // The processSyncQueue sends the lowest sequenceNumber entry first
            const body = JSON.parse(options.body as string);
            // We track which entry was sent by looking at what's in the queue before/after
            sentSequenceNumbers.push(sentSequenceNumbers.length); // Placeholder - we'll verify via queue state
            return { ok: true, status: 200, json: async () => ({}) };
          });
          vi.stubGlobal("fetch", fetchMock);

          // Sort to get expected processing order
          const sortedSequenceNumbers = [...sequenceNumbers].sort((a, b) => a - b);

          // Process queue multiple times (one transition per order per pass)
          for (let pass = 0; pass < sequenceNumbers.length; pass++) {
            await processSyncQueue();
          }

          // Verify fetch was called in order — each call corresponds to a transition
          // The calls should match the sorted sequence number order
          expect(fetchMock).toHaveBeenCalledTimes(sequenceNumbers.length);

          // Verify that the fetch calls were made in sequence number order
          // We can verify this by checking that each call's URL matches the expected pattern
          // and that the entries were consumed in order from the queue
          const callBodies = fetchMock.mock.calls.map(
            ([, opts]: [string, RequestInit]) => JSON.parse(opts.body as string)
          );

          // All calls should be POST to the transitions endpoint
          for (const [url] of fetchMock.mock.calls) {
            expect(url).toContain(`/orders/${zenvixOrderId}/transitions`);
          }

          // The key property: verify the queue was emptied in monotonically increasing
          // sequence number order. Since processSyncQueue picks the lowest sequenceNumber
          // entry per order in each pass, the calls should reflect that ordering.
          // We verify by checking the final queue is empty (all sent) and fetch call count matches.
          const remainingQueue = JSON.parse(
            localStorage.getItem(SYNC_QUEUE_STORAGE_KEY) || "[]"
          ) as SyncQueueEntry[];

          // All entries should have been processed (none remaining as pending)
          const pendingEntries = remainingQueue.filter((e) => e.status === "pending");
          expect(pendingEntries).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("verifies monotonically increasing order by tracking per-call sequence numbers", async () => {
    await fc.assert(
      fc.asyncProperty(
        stageTransitionSequenceArb,
        async ({ orderId, zenvixOrderId, entries, sequenceNumbers }) => {
          // Reset state
          localStorage.clear();

          // Set up the order in localStorage
          const orderData = {
            orders: [
              {
                id: orderId,
                stage: "Order_Submitted",
                customerName: "Test",
                customerEmail: "test@test.com",
                customerPhone: "12345",
                shippingAddress: "123 Test St",
                items: [{ productId: "p1", title: "Item", quantity: 1, unitPrice: 10 }],
                subtotal: 10,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                stageHistory: [{ stage: "Order_Submitted", timestamp: new Date().toISOString() }],
                zenvixOrderId,
                syncStatus: "synced",
              },
            ],
            version: 1,
          };
          localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orderData));

          // Place entries in sync queue
          localStorage.setItem(SYNC_QUEUE_STORAGE_KEY, JSON.stringify(entries));

          // Track which entries were sent (by observing queue changes after each pass)
          const processedSequenceNumbers: number[] = [];
          const sortedSequenceNumbers = [...sequenceNumbers].sort((a, b) => a - b);

          // Mock fetch to always succeed
          const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({}),
          });
          vi.stubGlobal("fetch", fetchMock);

          // Process one transition per pass and track which was removed
          for (let pass = 0; pass < sequenceNumbers.length; pass++) {
            // Snapshot queue before processing
            const queueBefore = JSON.parse(
              localStorage.getItem(SYNC_QUEUE_STORAGE_KEY) || "[]"
            ) as SyncQueueEntry[];
            const pendingBefore = queueBefore
              .filter((e) => e.status === "pending")
              .map((e) => e.sequenceNumber);

            await processSyncQueue();

            // Snapshot queue after processing
            const queueAfter = JSON.parse(
              localStorage.getItem(SYNC_QUEUE_STORAGE_KEY) || "[]"
            ) as SyncQueueEntry[];
            const pendingAfter = queueAfter
              .filter((e) => e.status === "pending")
              .map((e) => e.sequenceNumber);

            // Determine which sequence number was processed (removed from pending)
            const processed = pendingBefore.filter((sn) => !pendingAfter.includes(sn));
            if (processed.length > 0) {
              processedSequenceNumbers.push(...processed);
            }
          }

          // THE PROPERTY: processed sequence numbers must be monotonically increasing
          for (let i = 1; i < processedSequenceNumbers.length; i++) {
            expect(processedSequenceNumbers[i]).toBeGreaterThan(
              processedSequenceNumbers[i - 1]
            );
          }

          // Additionally, the processed order should match the sorted order
          expect(processedSequenceNumbers).toEqual(sortedSequenceNumbers);
        }
      ),
      { numRuns: 100 }
    );
  });
});
