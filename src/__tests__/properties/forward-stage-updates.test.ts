import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { applyStatusUpdate } from "@/api/zenvix-notification-poller";
import type { OrderRecord, OrderStage } from "@/types/order";

/**
 * Feature: vps-deployment-zenvix-integration, Property 12: Forward-stage poller updates are applied correctly
 * **Validates: Requirements 7.2, 11.1, 11.3**
 */

const ORDERS_STORAGE_KEY = "bambu_whatsapp_orders";

/**
 * Ordered list of stages from earliest to latest.
 */
const STAGE_ORDER: readonly OrderStage[] = [
  "Order_Submitted",
  "Quotation_Pending",
  "Quotation_Sent",
  "Payment_Pending",
  "Payment_Confirmed",
  "Complete",
] as const;

/**
 * The first 5 stages (not Complete) — valid source stages for forward updates.
 */
const NON_TERMINAL_STAGES = STAGE_ORDER.slice(0, 5) as OrderStage[];

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
    stageHistory: [{ stage: "Order_Submitted", timestamp: new Date().toISOString(), source: "local" }],
    zenvixOrderId: "zenvix-order-123",
    syncStatus: "synced",
    ...overrides,
  };
}

describe("Property 12: Forward-stage poller updates are applied correctly", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "debug").mockImplementation(() => {});
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("advances local order to stage T and appends stageHistory with source='zenvix_admin' when T is later than S", () => {
    fc.assert(
      fc.property(
        // Generate an index into the first 5 stages (source stage S)
        fc.integer({ min: 0, max: 3 }),
        // Generate a relative offset (1-based) to pick a later stage T
        fc.integer({ min: 1, max: 5 }),
        (sourceIndex, offset) => {
          // Ensure T index is valid (strictly later than S, within bounds)
          const targetIndex = sourceIndex + offset;
          if (targetIndex >= STAGE_ORDER.length) return; // skip if out of bounds

          const stageS = NON_TERMINAL_STAGES[sourceIndex];
          const stageT = STAGE_ORDER[targetIndex];

          // Clear localStorage for each run
          localStorage.clear();

          // Create an order at stage S and place in localStorage
          const order = createTestOrder({
            stage: stageS,
            stageHistory: [{ stage: stageS, timestamp: new Date().toISOString(), source: "local" }],
          });

          const ordersData = { orders: [order], version: 1 };
          localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(ordersData));

          // Call applyStatusUpdate with the later stage T
          const result = applyStatusUpdate(order.id, stageT);

          // Verify: returns true
          expect(result).toBe(true);

          // Verify: order's stage is now T
          const stored = JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || "{}");
          const updatedOrder = stored.orders?.find((o: OrderRecord) => o.id === order.id);

          expect(updatedOrder).toBeDefined();
          expect(updatedOrder.stage).toBe(stageT);

          // Verify: stageHistory has new entry with stage=T and source="zenvix_admin"
          const lastHistoryEntry = updatedOrder.stageHistory[updatedOrder.stageHistory.length - 1];
          expect(lastHistoryEntry.stage).toBe(stageT);
          expect(lastHistoryEntry.source).toBe("zenvix_admin");
          // Verify timestamp is a valid ISO 8601 string
          expect(new Date(lastHistoryEntry.timestamp).toISOString()).toBe(lastHistoryEntry.timestamp);
        }
      ),
      { numRuns: 100 }
    );
  });
});
