import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fc from "fast-check";
import { processSyncQueue, SYNC_QUEUE_STORAGE_KEY } from "@/api/zenvix-order-sync";
import type { OrderRecord, OrderStage, SyncQueueEntry } from "@/types/order";

/**
 * Feature: vps-deployment-zenvix-integration, Property 8: Deferred transitions until order_id available
 * **Validates: Requirements 5.6**
 *
 * For any order where zenvixOrderId is null, all queued stage transitions SHALL remain
 * in "deferred" status and SHALL NOT be sent to the API until the order creation sync
 * completes and populates the zenvixOrderId.
 */

// Mock zenvix-config to allow processSyncQueue to run
vi.mock("@/api/zenvix-config", () => ({
  isZenvixConfigured: () => true,
  getZenvixConfig: () => ({
    gatewayUrl: "http://localhost:3001/api/retail/public",
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
  getZenvixApiUrl: () => "http://localhost:3001/api/retail/public",
  getZenvixChannelRecordId: () => "channel-123",
  getZenvixTenantId: () => "test-tenant",
  getZenvixClientId: () => "test-client",
  getZenvixClientSecret: () => "test-secret",
  getZenvixApiKey: () => "test-key",
  getZenvixBranchId: () => "test-branch",
  isZenvixConfigured: () => true,
}));

const ORDERS_STORAGE_KEY = "bambu_whatsapp_orders";

const ALL_STAGES: OrderStage[] = [
  "Order_Submitted",
  "Quotation_Pending",
  "Quotation_Sent",
  "Payment_Pending",
  "Payment_Confirmed",
  "Complete",
];

// Generator for a valid stage transition pair (from -> to where to is a later stage)
const stageTransitionArb = fc
  .integer({ min: 0, max: ALL_STAGES.length - 2 })
  .chain((fromIndex) =>
    fc
      .integer({ min: fromIndex + 1, max: ALL_STAGES.length - 1 })
      .map((toIndex) => ({
        fromStage: ALL_STAGES[fromIndex],
        toStage: ALL_STAGES[toIndex],
      }))
  );

// Generator for deferred sync queue entries (1 to 4 transitions per order)
const deferredEntriesArb = (orderId: string) =>
  fc
    .integer({ min: 1, max: 4 })
    .chain((count) =>
      fc
        .tuple(
          ...Array.from({ length: count }, (_, i) =>
            stageTransitionArb.map((transition) => ({
              id: `deferred-${orderId}-${i}`,
              orderId,
              type: "stage_transition" as const,
              payload: {
                order_id: null as unknown,
                from_stage: transition.fromStage,
                to_stage: transition.toStage,
                timestamp: new Date().toISOString(),
              } as Record<string, unknown>,
              retries: 0,
              maxRetries: 5,
              nextRetryAt: 0,
              status: "deferred" as const,
              sequenceNumber: i + 1,
              createdAt: new Date().toISOString(),
            }))
          )
        )
    );

// Generator for order without zenvixOrderId
const orderWithoutZenvixIdArb = fc.uuid().map((id) => ({
  id,
  stage: "Order_Submitted" as OrderStage,
  customerName: "Test Customer",
  customerEmail: "test@example.com",
  customerPhone: "1234567890",
  shippingAddress: "123 Test St",
  items: [{ productId: "prod-1", title: "Silver Ring", quantity: 1, unitPrice: 50.0 }],
  subtotal: 50.0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  stageHistory: [{ stage: "Order_Submitted" as OrderStage, timestamp: new Date().toISOString() }],
  // Explicitly no zenvixOrderId
}));

describe("Property 8: Deferred transitions until order_id available", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "debug").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("deferred entries are NOT sent when order has no zenvixOrderId", async () => {
    await fc.assert(
      fc.asyncProperty(
        orderWithoutZenvixIdArb,
        async (order) => {
          localStorage.clear();
          fetchMock.mockClear();

          // Persist the order WITHOUT zenvixOrderId in localStorage
          const ordersData = { orders: [order], version: 1 };
          localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(ordersData));

          // Create deferred queue entries for this order
          const entries: SyncQueueEntry[] = [];
          const numEntries = 1 + Math.floor(Math.random() * 3); // 1-3 entries
          for (let i = 0; i < numEntries; i++) {
            entries.push({
              id: `deferred-${order.id}-${i}`,
              orderId: order.id,
              type: "stage_transition",
              payload: {
                order_id: null,
                from_stage: ALL_STAGES[i],
                to_stage: ALL_STAGES[i + 1],
                timestamp: new Date().toISOString(),
              },
              retries: 0,
              maxRetries: 5,
              nextRetryAt: 0,
              status: "deferred",
              sequenceNumber: i + 1,
              createdAt: new Date().toISOString(),
            });
          }
          localStorage.setItem(SYNC_QUEUE_STORAGE_KEY, JSON.stringify(entries));

          // Process the sync queue
          await processSyncQueue();

          // Verify: fetch should NOT have been called (deferred entries stay deferred)
          expect(fetchMock).not.toHaveBeenCalled();

          // Verify: all entries remain in the queue with 'deferred' status
          const raw = localStorage.getItem(SYNC_QUEUE_STORAGE_KEY);
          expect(raw).not.toBeNull();
          const resultQueue: SyncQueueEntry[] = JSON.parse(raw!);

          for (const entry of entries) {
            const result = resultQueue.find((e) => e.id === entry.id);
            expect(result).toBeDefined();
            expect(result!.status).toBe("deferred");
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("deferred entries are promoted and sent once zenvixOrderId is populated", async () => {
    await fc.assert(
      fc.asyncProperty(
        orderWithoutZenvixIdArb,
        fc.uuid(),
        async (order, zenvixOrderId) => {
          localStorage.clear();
          fetchMock.mockClear();

          // Persist the order WITHOUT zenvixOrderId first
          const ordersData = { orders: [order], version: 1 };
          localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(ordersData));

          // Create deferred queue entries
          const entries: SyncQueueEntry[] = [
            {
              id: `deferred-${order.id}-0`,
              orderId: order.id,
              type: "stage_transition",
              payload: {
                order_id: null,
                from_stage: "Order_Submitted",
                to_stage: "Quotation_Pending",
                timestamp: new Date().toISOString(),
              },
              retries: 0,
              maxRetries: 5,
              nextRetryAt: 0,
              status: "deferred",
              sequenceNumber: 1,
              createdAt: new Date().toISOString(),
            },
          ];
          localStorage.setItem(SYNC_QUEUE_STORAGE_KEY, JSON.stringify(entries));

          // First call — entries should stay deferred (no zenvixOrderId)
          await processSyncQueue();
          expect(fetchMock).not.toHaveBeenCalled();

          // Now populate zenvixOrderId on the order in localStorage
          const updatedOrdersData = {
            orders: [{ ...order, zenvixOrderId }],
            version: 1,
          };
          localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updatedOrdersData));

          // Second call — entries should be promoted to 'pending' and processed
          fetchMock.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({}),
          });

          await processSyncQueue();

          // Verify: fetch WAS called (entry was promoted and sent)
          expect(fetchMock).toHaveBeenCalled();

          // Verify the request was made to the correct transitions endpoint
          const callArgs = fetchMock.mock.calls[0];
          const url = callArgs[0] as string;
          expect(url).toContain(`/orders/${zenvixOrderId}/transitions`);

          // Verify the payload contains the zenvixOrderId
          const body = JSON.parse(callArgs[1].body);
          expect(body.order_id).toBe(zenvixOrderId);
        }
      ),
      { numRuns: 100 }
    );
  });
});
