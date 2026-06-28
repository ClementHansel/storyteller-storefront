import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { syncOrderCreation } from "@/api/zenvix-order-sync";
import type { OrderRecord } from "@/types/order";

/**
 * Feature: vps-deployment-zenvix-integration, Property 2: Zenvix order_id is persisted on successful sync
 * **Validates: Requirements 4.2**
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

function createTestOrder(overrides: Partial<OrderRecord> = {}): OrderRecord {
  return {
    id: crypto.randomUUID(),
    stage: "Order_Submitted",
    customerName: "Test Customer",
    customerEmail: "test@example.com",
    customerPhone: "1234567890",
    shippingAddress: "123 Test Street, City, Country",
    items: [{ productId: "prod-1", title: "Silver Ring", quantity: 1, unitPrice: 50.0 }],
    subtotal: 50.0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stageHistory: [{ stage: "Order_Submitted", timestamp: new Date().toISOString() }],
    ...overrides,
  };
}

describe("Property 2: Zenvix order_id is persisted on successful sync", () => {
  let originalEnv: Record<string, string | undefined> | undefined;
  let savedImportMetaEnv: Record<string, string | undefined>;
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    // Set up window.__ENV__ with all required Zenvix vars
    originalEnv = window.__ENV__;
    window.__ENV__ = { ...REQUIRED_ENV_VARS };

    // Save and set import.meta.env vars as backup
    savedImportMetaEnv = {};
    for (const [key, value] of Object.entries(REQUIRED_ENV_VARS)) {
      savedImportMetaEnv[key] = (import.meta.env as Record<string, string | undefined>)[key];
      (import.meta.env as Record<string, string | undefined>)[key] = value;
    }

    // Clear localStorage
    localStorage.clear();

    // Save original fetch
    originalFetch = globalThis.fetch;

    // Suppress console output
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "debug").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    window.__ENV__ = originalEnv;
    // Restore import.meta.env
    for (const key of Object.keys(REQUIRED_ENV_VARS)) {
      if (savedImportMetaEnv[key] !== undefined) {
        (import.meta.env as Record<string, string | undefined>)[key] = savedImportMetaEnv[key];
      } else {
        delete (import.meta.env as Record<string, string | undefined>)[key];
      }
    }
    globalThis.fetch = originalFetch;
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("persists the returned order_id as zenvixOrderId on the OrderRecord in localStorage", async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random UUIDs as the order_id returned by Zenvix
        fc.uuid(),
        async (generatedOrderId) => {
          // Clear localStorage for each run
          localStorage.clear();

          // Create an order and persist it in localStorage
          const order = createTestOrder();
          const ordersData = { orders: [order], version: 1 };
          localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(ordersData));

          // Mock fetch to return a 200 response with the generated order_id
          globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ order_id: generatedOrderId }),
          });

          // Call syncOrderCreation
          await syncOrderCreation(order);

          // Verify the OrderRecord in localStorage has zenvixOrderId set
          const stored = JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || "{}");
          const updatedOrder = stored.orders?.find((o: OrderRecord) => o.id === order.id);

          expect(updatedOrder).toBeDefined();
          expect(updatedOrder.zenvixOrderId).toBe(generatedOrderId);
          expect(updatedOrder.syncStatus).toBe("synced");
        }
      ),
      { numRuns: 100 }
    );
  });
});
