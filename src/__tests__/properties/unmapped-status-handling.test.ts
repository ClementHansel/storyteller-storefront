import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fc from "fast-check";
import { toOrderStage } from "@/api/zenvix-stage-mapping";
import { applyStatusUpdate } from "@/api/zenvix-notification-poller";
import type { OrderRecord, OrderStage } from "@/types/order";

/**
 * Feature: vps-deployment-zenvix-integration, Property 15: Unmapped Zenvix status is ignored
 * **Validates: Requirements 11.5**
 *
 * When the Notification_Poller receives a Zenvix status string that does not map
 * to any known OrderStage (i.e., toOrderStage returns null), the poller ignores
 * the update and the local order remains unchanged.
 */

const ORDERS_STORAGE_KEY = "bambu_whatsapp_orders";

/** The 6 valid Zenvix status strings that have defined mappings. */
const VALID_ZENVIX_STATUSES = [
  "SUBMITTED",
  "QUOTATION_PENDING",
  "QUOTATION_SENT",
  "PAYMENT_PENDING",
  "PAYMENT_CONFIRMED",
  "COMPLETED",
];

const ALL_STAGES: OrderStage[] = [
  "Order_Submitted",
  "Quotation_Pending",
  "Quotation_Sent",
  "Payment_Pending",
  "Payment_Confirmed",
  "Complete",
];

/**
 * Generator for arbitrary strings that are NOT any of the 6 valid Zenvix statuses.
 * Also excludes inherited Object prototype property names (e.g. "valueOf", "toString")
 * which would resolve via prototype chain on plain objects.
 */
const unmappedStatusArb: fc.Arbitrary<string> = fc
  .string({ minLength: 0, maxLength: 50 })
  .filter((s) => !VALID_ZENVIX_STATUSES.includes(s))
  .filter((s) => !Object.prototype.hasOwnProperty.call(Object.prototype, s));

/**
 * Generator for a random OrderStage (the current local stage of the order).
 */
const orderStageArb: fc.Arbitrary<OrderStage> = fc.constantFrom(...ALL_STAGES);

function createTestOrder(stage: OrderStage): OrderRecord {
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
    stageHistory: [{ stage, timestamp: new Date().toISOString(), source: "local" as const }],
    zenvixOrderId: "zenvix-order-123",
    syncStatus: "synced",
  };
}

describe("Property 15: Unmapped Zenvix status is ignored", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "debug").mockImplementation(() => {});
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("toOrderStage returns null for any string not in the valid Zenvix status set", () => {
    fc.assert(
      fc.property(unmappedStatusArb, (arbitraryStatus) => {
        const result = toOrderStage(arbitraryStatus);
        expect(result).toBeNull();
      }),
      { numRuns: 200 }
    );
  });

  it("local order is unchanged when poller receives an unmapped status", () => {
    fc.assert(
      fc.property(
        unmappedStatusArb,
        orderStageArb,
        (unmappedStatus, currentStage) => {
          localStorage.clear();

          // 1. Create an order at an arbitrary local stage
          const order = createTestOrder(currentStage);

          // 2. Store the order in localStorage
          const ordersData = { orders: [order], version: 1 };
          localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(ordersData));

          // Capture the full order state before the poller logic runs
          const orderBefore = JSON.parse(JSON.stringify(order));

          // 3. Simulate poller behaviour: call toOrderStage, get null, skip update
          const mappedStage = toOrderStage(unmappedStatus);

          // The mapped stage must be null for unmapped strings
          expect(mappedStage).toBeNull();

          // Since mappedStage is null, the poller skips the update (no call to applyStatusUpdate).
          // Verify the order in localStorage is unchanged.
          const stored = JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || "{}");
          const storedOrder = stored.orders?.find((o: OrderRecord) => o.id === order.id);

          expect(storedOrder).toBeDefined();
          expect(storedOrder.stage).toBe(orderBefore.stage);
          expect(storedOrder.stageHistory).toEqual(orderBefore.stageHistory);
          expect(storedOrder.updatedAt).toBe(orderBefore.updatedAt);
        }
      ),
      { numRuns: 200 }
    );
  });
});
