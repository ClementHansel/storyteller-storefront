import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fc from "fast-check";
import { syncOrderCreation, syncStageTransition } from "@/api/zenvix-order-sync";
import type { OrderRecord, OrderStage } from "@/types/order";

/**
 * Feature: vps-deployment-zenvix-integration, Property 9: Sync operations do not block local state changes
 * **Validates: Requirements 5.4, 10.5**
 *
 * Verifies that syncStageTransition and syncOrderCreation are non-blocking:
 * 1. They don't throw on network errors or 5xx responses
 * 2. They return (resolve) even when the API call fails
 * 3. Local order state changes (done before calling sync) are preserved regardless
 */

const ORDERS_STORAGE_KEY = "bambu_whatsapp_orders";

const REQUIRED_ENV_VARS: Record<string, string> = {
  VITE_ZENVIX_API_URL: "http://localhost:3001/api/retail/public",
  VITE_ZENVIX_TENANT_ID: "test-tenant-id",
  VITE_ZENVIX_CLIENT_ID: "test-client-id",
  VITE_ZENVIX_CLIENT_SECRET: "test-client-secret",
  VITE_ZENVIX_CHANNEL_RECORD_ID: "test-channel-record",
  VITE_ZENVIX_API_KEY: "test-api-key",
  VITE_ZENVIX_BRANCH_ID: "test-branch-id",
};

// --- Error scenario generator ---

type ErrorScenario =
  | { type: "network_error"; message: string }
  | { type: "server_error"; status: number };

const errorScenario: fc.Arbitrary<ErrorScenario> = fc.oneof(
  // Network errors (fetch throws)
  fc.constantFrom(
    "Failed to fetch",
    "NetworkError when attempting to fetch resource",
    "net::ERR_CONNECTION_REFUSED",
    "The operation was aborted due to timeout",
    "ECONNRESET"
  ).map((message) => ({ type: "network_error" as const, message })),
  // Server errors (5xx responses)
  fc.constantFrom(500, 502, 503, 504).map((status) => ({
    type: "server_error" as const,
    status,
  }))
);

// --- Stage pairs generator (valid from → to transitions) ---

const STAGE_PAIRS: Array<[OrderStage, OrderStage]> = [
  ["Order_Submitted", "Quotation_Pending"],
  ["Quotation_Pending", "Quotation_Sent"],
  ["Quotation_Sent", "Payment_Pending"],
  ["Payment_Pending", "Payment_Confirmed"],
  ["Payment_Confirmed", "Complete"],
];

const validStagePair: fc.Arbitrary<[OrderStage, OrderStage]> = fc.constantFrom(...STAGE_PAIRS);

// --- Helpers ---

function createTestOrder(overrides: Partial<OrderRecord> = {}): OrderRecord {
  return {
    id: crypto.randomUUID(),
    stage: "Order_Submitted",
    customerName: "Test Customer",
    customerEmail: "test@example.com",
    customerPhone: "1234567890",
    shippingAddress: "123 Test Street, City, Country",
    items: [
      { productId: "prod-1", title: "Silver Ring", quantity: 2, unitPrice: 75.0 },
      { productId: "prod-2", title: "Silver Necklace", quantity: 1, unitPrice: 120.0 },
    ],
    subtotal: 270.0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stageHistory: [{ stage: "Order_Submitted", timestamp: new Date().toISOString() }],
    syncStatus: "pending",
    ...overrides,
  };
}

function mockFetchForScenario(scenario: ErrorScenario): void {
  if (scenario.type === "network_error") {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError(scenario.message));
  } else {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: scenario.status,
      statusText: `Server Error ${scenario.status}`,
      json: async () => ({ error: "Internal Server Error" }),
    });
  }
}

describe("Property 9: Sync operations do not block local state changes", () => {
  let originalEnv: Record<string, string | undefined> | undefined;
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    // Set up window.__ENV__ with all required Zenvix vars
    originalEnv = window.__ENV__;
    window.__ENV__ = { ...REQUIRED_ENV_VARS };

    // Clear localStorage
    localStorage.clear();

    // Save original fetch
    originalFetch = globalThis.fetch;

    // Suppress console output during tests
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "debug").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    window.__ENV__ = originalEnv;
    globalThis.fetch = originalFetch;
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("syncOrderCreation resolves without throwing on any error scenario", async () => {
    await fc.assert(
      fc.asyncProperty(errorScenario, async (scenario) => {
        localStorage.clear();

        // Create and persist an order
        const order = createTestOrder();
        const ordersData = { orders: [order], version: 1 };
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(ordersData));

        // Mock fetch to produce the error scenario
        mockFetchForScenario(scenario);

        // syncOrderCreation should resolve without throwing
        await expect(syncOrderCreation(order)).resolves.toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });

  it("syncStageTransition resolves without throwing on any error scenario", async () => {
    await fc.assert(
      fc.asyncProperty(
        errorScenario,
        validStagePair,
        async (scenario, [fromStage, toStage]) => {
          localStorage.clear();

          // Create and persist an order with a zenvixOrderId (so it attempts the sync)
          const order = createTestOrder({
            stage: toStage, // Already transitioned locally
            zenvixOrderId: "zenvix-order-12345",
            syncStatus: "synced",
          });
          const ordersData = { orders: [order], version: 1 };
          localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(ordersData));

          // Mock fetch to produce the error scenario
          mockFetchForScenario(scenario);

          // syncStageTransition should resolve without throwing
          await expect(
            syncStageTransition(order.id, fromStage, toStage)
          ).resolves.toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("local order state (items, stage, customer data) is preserved after syncOrderCreation failure", async () => {
    await fc.assert(
      fc.asyncProperty(errorScenario, async (scenario) => {
        localStorage.clear();

        // Create an order with specific state to verify preservation
        const order = createTestOrder({
          items: [
            { productId: "prod-abc", title: "Bamboo Bracelet", quantity: 3, unitPrice: 45.0 },
            { productId: "prod-def", title: "Silver Earrings", quantity: 1, unitPrice: 85.5 },
          ],
          subtotal: 220.5,
          stage: "Order_Submitted",
        });
        const ordersData = { orders: [order], version: 1 };
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(ordersData));

        // Mock fetch to produce the error scenario
        mockFetchForScenario(scenario);

        // Call syncOrderCreation (it will fail, but should not corrupt local data)
        await syncOrderCreation(order);

        // Verify local order state is preserved
        const stored = JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || "{}");
        const updatedOrder = stored.orders?.find((o: OrderRecord) => o.id === order.id);

        expect(updatedOrder).toBeDefined();
        // Core data must be untouched
        expect(updatedOrder.items).toHaveLength(2);
        expect(updatedOrder.items[0].productId).toBe("prod-abc");
        expect(updatedOrder.items[0].quantity).toBe(3);
        expect(updatedOrder.items[0].unitPrice).toBe(45.0);
        expect(updatedOrder.items[1].productId).toBe("prod-def");
        expect(updatedOrder.items[1].quantity).toBe(1);
        expect(updatedOrder.items[1].unitPrice).toBe(85.5);
        expect(updatedOrder.subtotal).toBe(220.5);
        expect(updatedOrder.stage).toBe("Order_Submitted");
        expect(updatedOrder.customerName).toBe("Test Customer");
        expect(updatedOrder.customerEmail).toBe("test@example.com");
        expect(updatedOrder.customerPhone).toBe("1234567890");
        expect(updatedOrder.shippingAddress).toBe("123 Test Street, City, Country");
      }),
      { numRuns: 100 }
    );
  });

  it("local order state is preserved after syncStageTransition failure", async () => {
    await fc.assert(
      fc.asyncProperty(
        errorScenario,
        validStagePair,
        async (scenario, [fromStage, toStage]) => {
          localStorage.clear();

          // Create an order that has already been transitioned locally
          const order = createTestOrder({
            stage: toStage,
            zenvixOrderId: "zenvix-order-99999",
            syncStatus: "synced",
            items: [
              { productId: "prod-xyz", title: "Gold Ring", quantity: 2, unitPrice: 150.0 },
            ],
            subtotal: 300.0,
            stageHistory: [
              { stage: "Order_Submitted", timestamp: new Date().toISOString() },
              { stage: toStage, timestamp: new Date().toISOString() },
            ],
          });
          const ordersData = { orders: [order], version: 1 };
          localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(ordersData));

          // Mock fetch to produce the error scenario
          mockFetchForScenario(scenario);

          // Call syncStageTransition (it will fail, but should not corrupt local data)
          await syncStageTransition(order.id, fromStage, toStage);

          // Verify local order state is preserved
          const stored = JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || "{}");
          const updatedOrder = stored.orders?.find((o: OrderRecord) => o.id === order.id);

          expect(updatedOrder).toBeDefined();
          // Stage must remain as set locally (toStage)
          expect(updatedOrder.stage).toBe(toStage);
          // Items must be untouched
          expect(updatedOrder.items).toHaveLength(1);
          expect(updatedOrder.items[0].productId).toBe("prod-xyz");
          expect(updatedOrder.items[0].quantity).toBe(2);
          expect(updatedOrder.items[0].unitPrice).toBe(150.0);
          expect(updatedOrder.subtotal).toBe(300.0);
          // Customer data preserved
          expect(updatedOrder.customerName).toBe("Test Customer");
          expect(updatedOrder.customerEmail).toBe("test@example.com");
          // zenvixOrderId preserved
          expect(updatedOrder.zenvixOrderId).toBe("zenvix-order-99999");
        }
      ),
      { numRuns: 100 }
    );
  });
});
