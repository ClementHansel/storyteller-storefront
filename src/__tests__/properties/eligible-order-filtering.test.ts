import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { getEligibleOrders } from "@/api/zenvix-notification-poller";
import type { OrderRecord, OrderStage } from "@/types/order";

/**
 * Feature: vps-deployment-zenvix-integration, Property 14: Poller only polls eligible orders
 * **Validates: Requirements 7.5**
 *
 * For any set of orders in localStorage, the Notification_Poller SHALL only poll those
 * that have a non-null zenvixOrderId AND whose current stage is not "Complete".
 */

const ORDERS_STORAGE_KEY = "bambu_whatsapp_orders";

const ALL_STAGES: OrderStage[] = [
  "Order_Submitted",
  "Quotation_Pending",
  "Quotation_Sent",
  "Payment_Pending",
  "Payment_Confirmed",
  "Complete",
];

// Generator for a random OrderStage
const arbStage = fc.constantFrom(...ALL_STAGES);

// Generator for a random zenvixOrderId: either a UUID string or undefined
const arbZenvixOrderId = fc.oneof(
  { weight: 1, arbitrary: fc.constant(undefined) },
  { weight: 2, arbitrary: fc.uuid() }
);

// Generator for a single OrderRecord with random eligibility-relevant properties
const arbOrderRecord: fc.Arbitrary<OrderRecord> = fc.record({
  id: fc.uuid(),
  stage: arbStage,
  customerName: fc.constant("Test Customer"),
  customerEmail: fc.constant("test@example.com"),
  customerPhone: fc.constant("1234567890"),
  shippingAddress: fc.constant("123 Test Street"),
  items: fc.constant([{ productId: "prod-1", title: "Silver Ring", quantity: 1, unitPrice: 50 }]),
  subtotal: fc.constant(50),
  createdAt: fc.constant(new Date().toISOString()),
  updatedAt: fc.constant(new Date().toISOString()),
  stageHistory: fc.constant([{ stage: "Order_Submitted" as OrderStage, timestamp: new Date().toISOString() }]),
  zenvixOrderId: arbZenvixOrderId,
});

// Generator for arrays of 1 to 10 orders
const arbOrderArray = fc.array(arbOrderRecord, { minLength: 1, maxLength: 10 });

describe("Property 14: Poller only polls eligible orders", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("returns only orders with non-null zenvixOrderId AND stage !== 'Complete'", () => {
    fc.assert(
      fc.property(arbOrderArray, (orders) => {
        // Place orders in localStorage
        const ordersData = { orders, version: 1 };
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(ordersData));

        // Call getEligibleOrders
        const eligible = getEligibleOrders();

        // Property A: Every returned order has a non-null zenvixOrderId AND stage !== "Complete"
        for (const order of eligible) {
          expect(order.zenvixOrderId).not.toBeNull();
          expect(order.zenvixOrderId).not.toBeUndefined();
          expect(order.stage).not.toBe("Complete");
        }

        // Property B: No eligible order was missed
        const expectedEligible = orders.filter(
          (o) => o.zenvixOrderId != null && o.stage !== "Complete"
        );
        expect(eligible).toHaveLength(expectedEligible.length);

        // Verify the same set of order IDs
        const eligibleIds = new Set(eligible.map((o) => o.id));
        const expectedIds = new Set(expectedEligible.map((o) => o.id));
        expect(eligibleIds).toEqual(expectedIds);
      }),
      { numRuns: 200 }
    );
  });
});
