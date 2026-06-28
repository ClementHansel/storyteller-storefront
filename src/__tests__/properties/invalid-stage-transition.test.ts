import { describe, it, expect, beforeEach } from "vitest";
import * as fc from "fast-check";
import {
  validCheckoutFormData,
  validOrderRecordItemList,
  validOrderStage,
} from "../helpers/order-generators";
import { createOrder, transitionStage, getOrder } from "@/lib/order-store";
import { VALID_TRANSITIONS, OrderStage } from "@/types/order";

const ALL_STAGES: OrderStage[] = [
  "Order_Submitted",
  "Quotation_Pending",
  "Quotation_Sent",
  "Payment_Pending",
  "Payment_Confirmed",
  "Complete",
];

/**
 * Property 8: Invalid stage transitions are rejected
 *
 * For any OrderRecord at a given stage, attempting to transition to a stage
 * that is not the defined next stage in the transition map SHALL throw an
 * error and leave the order unchanged in localStorage.
 *
 * **Validates: Requirements 3.2, 4.1**
 */
describe("Feature: whatsapp-checkout-flow, Property 8: Invalid stage transitions are rejected", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("attempting an invalid stage transition throws an error and leaves the order unchanged", () => {
    fc.assert(
      fc.property(
        validCheckoutFormData,
        validOrderRecordItemList,
        fc.integer({ min: 0, max: 5 }),
        validOrderStage,
        (formData, items, stepsToAdvance, randomTargetStage) => {
          // 1. Create an order
          const subtotal = items.reduce(
            (sum, item) => sum + item.quantity * item.unitPrice,
            0
          );
          const order = createOrder({
            customerName: formData.customerName,
            customerEmail: formData.customerEmail,
            customerPhone: formData.customerPhone,
            shippingAddress: formData.shippingAddress,
            items,
            subtotal,
          });

          // Advance the order through 0-5 valid transitions sequentially
          let currentOrderId = order.id;
          let currentStage: OrderStage = "Order_Submitted";

          const transitionSequence: OrderStage[] = [
            "Quotation_Pending",
            "Quotation_Sent",
            "Payment_Pending",
            "Payment_Confirmed",
            "Complete",
          ];

          const maxSteps = Math.min(stepsToAdvance, transitionSequence.length);
          for (let i = 0; i < maxSteps; i++) {
            transitionStage(currentOrderId, transitionSequence[i]);
            currentStage = transitionSequence[i];
          }

          // 2. Pick a target stage that is NOT the valid next stage for the current stage
          const validNext = VALID_TRANSITIONS[currentStage];
          const invalidTargets = ALL_STAGES.filter(
            (stage) => stage !== validNext
          );

          // If there are no invalid targets (shouldn't happen), skip
          if (invalidTargets.length === 0) return;

          // Use the randomTargetStage to pick from invalid targets deterministically
          const targetIndex =
            Math.abs(ALL_STAGES.indexOf(randomTargetStage)) %
            invalidTargets.length;
          const invalidTarget = invalidTargets[targetIndex];

          // Get the order state before the invalid transition attempt
          const orderBefore = getOrder(currentOrderId);
          expect(orderBefore).not.toBeNull();
          const stageBefore = orderBefore!.stage;
          const stageHistoryLengthBefore = orderBefore!.stageHistory.length;

          // 3. Attempt the invalid transition
          // 4. Verify: an error is thrown
          expect(() => {
            transitionStage(currentOrderId, invalidTarget);
          }).toThrow();

          // 5. Verify: the order in localStorage is unchanged (same stage, same stageHistory length)
          const orderAfter = getOrder(currentOrderId);
          expect(orderAfter).not.toBeNull();
          expect(orderAfter!.stage).toBe(stageBefore);
          expect(orderAfter!.stageHistory.length).toBe(
            stageHistoryLengthBefore
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
