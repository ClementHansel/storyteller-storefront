import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fc from "fast-check";
import { applyStatusUpdate } from "@/api/zenvix-notification-poller";
import type { OrderRecord, OrderStage } from "@/types/order";

/**
 * Feature: vps-deployment-zenvix-integration, Property 13: Backward or same-stage poller updates are discarded
 * **Validates: Requirements 7.6, 11.2**
 *
 * For any order at local stage S, when the Notification_Poller receives a Zenvix status
 * mapping to stage T where T is the same as or earlier than S in the stage sequence,
 * the local order SHALL remain at stage S with no modifications.
 */

const ORDERS_STORAGE_KEY = "bambu_whatsapp_orders";

const STAGE_ORDER: OrderStage[] = [
  "Order_Submitted",
  "Quotation_Pending",
  "Quotation_Sent",
  "Payment_Pending",
  "Payment_Confirmed",
  "Complete",
];

/**
 * Generator for a stage S and a target stage T that is same or earlier than S.
 * Returns [currentStage, targetStage] where targetStage <= currentStage in the ordering.
 */
const sameOrEarlierStagePair: fc.Arbitrary<[OrderStage, OrderStage]> = fc
  .integer({ min: 0, max: 5 })
  .chain((currentIndex) => {
    // Target stage must be same or earlier (index <= currentIndex)
    return fc
      .integer({ min: 0, max: currentIndex })
      .map((targetIndex) => [STAGE_ORDER[currentIndex], STAGE_ORDER[targetIndex]] as [OrderStage, OrderStage]);
  });

function createTestOrder(stage: OrderStage): OrderRecord {
  const stageHistory = [{ stage, timestamp: new Date().toISOString(), source: "local" as const }];
  return {
    id: crypto.randomUUID(),
    stage,
    customerName: "Test Customer",
    customerEmail: "test@example.com",
    customerPhone: "1234567890",
    shippingAddress: "123 Test Street, City, Country 12345",
    items: [
      { productId: "prod-1", title: "Silver Ring", quantity: 1, unitPrice: 75.0 },
    ],
    subtotal: 75.0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stageHistory,
    zenvixOrderId: "zenvix-order-123",
    syncStatus: "synced",
  };
}

describe("Property 13: Backward or same-stage poller updates are discarded", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "debug").mockImplementation(() => {});
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("applyStatusUpdate returns false and does not modify the order when target stage is same or earlier", () => {
    fc.assert(
      fc.property(sameOrEarlierStagePair, ([currentStage, targetStage]) => {
        localStorage.clear();

        // 1. Create an order at stage S
        const order = createTestOrder(currentStage);

        // 2. Store the order in localStorage
        const ordersData = { orders: [order], version: 1 };
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(ordersData));

        // Capture state before calling applyStatusUpdate
        const stageHistoryBefore = JSON.parse(JSON.stringify(order.stageHistory));

        // 3. Call applyStatusUpdate with the same or earlier stage T
        const result = applyStatusUpdate(order.id, targetStage);

        // 4. Verify: returns false
        expect(result).toBe(false);

        // 5. Verify: order's stage is still S and stageHistory is unchanged
        const stored = JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || "{}");
        const updatedOrder = stored.orders?.find((o: OrderRecord) => o.id === order.id);

        expect(updatedOrder).toBeDefined();
        expect(updatedOrder.stage).toBe(currentStage);
        expect(updatedOrder.stageHistory).toEqual(stageHistoryBefore);
      }),
      { numRuns: 100 }
    );
  });
});
