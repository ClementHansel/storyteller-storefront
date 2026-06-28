import * as fc from "fast-check";
import { describe, it, beforeEach } from "vitest";
import { createOrder, transitionStage } from "@/lib/order-store";
import { validCheckoutFormData, validOrderRecordItemList } from "@/__tests__/helpers/order-generators";
import type { OrderStage } from "@/types/order";

/**
 * Property 6: Stage transition persistence
 * Validates: Requirements 5.1
 *
 * For any valid OrderRecord and any valid stage transition (as defined by the
 * transition map), after performing the transition, the persisted data in
 * localStorage SHALL reflect the new stage, contain an updated timestamp,
 * and include a new entry in stageHistory with the new stage and timestamp.
 */

const STAGE_CHAIN: OrderStage[] = [
  "Order_Submitted",
  "Quotation_Pending",
  "Quotation_Sent",
  "Payment_Pending",
  "Payment_Confirmed",
  "Complete",
];

const STORAGE_KEY = "bambu_whatsapp_orders";

function isValidISOTimestamp(value: string): boolean {
  const date = new Date(value);
  return !isNaN(date.getTime()) && date.toISOString() === value;
}

describe("Feature: whatsapp-checkout-flow, Property 6: Stage transition persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stage transitions persist correct stage, updated timestamp, and stageHistory entry", () => {
    fc.assert(
      fc.property(
        validCheckoutFormData,
        validOrderRecordItemList,
        fc.integer({ min: 1, max: 5 }),
        (formData, items, numTransitions) => {
          // Clear localStorage for each property run
          localStorage.clear();

          // Calculate subtotal from items
          const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

          // Create an order (starts at Order_Submitted)
          const order = createOrder({
            customerName: formData.customerName,
            customerEmail: formData.customerEmail,
            customerPhone: formData.customerPhone,
            shippingAddress: formData.shippingAddress,
            items,
            subtotal,
          });

          let currentOrder = order;

          // Apply numTransitions valid transitions in sequence
          for (let i = 0; i < numTransitions; i++) {
            const currentStageIndex = STAGE_CHAIN.indexOf(currentOrder.stage);

            // If we've reached Complete, no more transitions possible
            if (currentStageIndex >= STAGE_CHAIN.length - 1) {
              break;
            }

            const newStage = STAGE_CHAIN[currentStageIndex + 1];
            const previousHistoryLength = currentOrder.stageHistory.length;

            // Apply the transition
            const updatedOrder = transitionStage(order.id, newStage);

            // Verify: returned order has the new stage
            if (updatedOrder.stage !== newStage) {
              return false;
            }

            // Verify: updatedAt is a valid ISO timestamp
            if (!isValidISOTimestamp(updatedOrder.updatedAt)) {
              return false;
            }

            // Verify: stageHistory has grown by 1 entry
            if (updatedOrder.stageHistory.length !== previousHistoryLength + 1) {
              return false;
            }

            // Verify: last stageHistory entry has the new stage and a valid timestamp
            const lastEntry = updatedOrder.stageHistory[updatedOrder.stageHistory.length - 1];
            if (lastEntry.stage !== newStage) {
              return false;
            }
            if (!isValidISOTimestamp(lastEntry.timestamp)) {
              return false;
            }

            // Verify: localStorage data reflects the new stage
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
              return false;
            }
            const persisted = JSON.parse(raw);
            const persistedOrder = persisted.orders.find(
              (o: { id: string }) => o.id === order.id
            );
            if (!persistedOrder) {
              return false;
            }
            if (persistedOrder.stage !== newStage) {
              return false;
            }

            currentOrder = updatedOrder;
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
