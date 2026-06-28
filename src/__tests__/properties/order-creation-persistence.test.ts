import * as fc from "fast-check";
import { describe, it, beforeEach } from "vitest";
import { createOrder } from "@/lib/order-store";
import {
  validCheckoutFormData,
  validOrderRecordItemList,
} from "@/__tests__/helpers/order-generators";

const STORAGE_KEY = "bambu_whatsapp_orders";

describe("Feature: whatsapp-checkout-flow, Property 1: Order creation produces a complete persisted record", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  /**
   * **Validates: Requirements 1.1**
   *
   * Property 1: Order creation produces a complete persisted record
   * For any valid checkout form data and any non-empty list of cart items,
   * creating an order SHALL produce a persisted OrderRecord in localStorage
   * with stage Order_Submitted, all customer fields intact, all items preserved
   * with correct quantities and prices, and a valid timestamp.
   */
  it("should produce a complete persisted record for any valid form data and item list", () => {
    fc.assert(
      fc.property(
        validCheckoutFormData,
        validOrderRecordItemList,
        fc.integer({ min: 1, max: 99999900 }).map((n) => n / 100),
        (formData, items, subtotal) => {
          // Clear localStorage before each iteration
          localStorage.clear();

          // Create the order
          const order = createOrder({
            customerName: formData.customerName,
            customerEmail: formData.customerEmail,
            customerPhone: formData.customerPhone,
            shippingAddress: formData.shippingAddress,
            items,
            subtotal,
          });

          // 1. Created order has stage Order_Submitted
          if (order.stage !== "Order_Submitted") {
            return false;
          }

          // 2. Customer fields are preserved exactly
          if (order.customerName !== formData.customerName) return false;
          if (order.customerEmail !== formData.customerEmail) return false;
          if (order.customerPhone !== formData.customerPhone) return false;
          if (order.shippingAddress !== formData.shippingAddress) return false;

          // 3. Items array is preserved exactly (productId, title, quantity, unitPrice)
          if (order.items.length !== items.length) return false;
          for (let i = 0; i < items.length; i++) {
            if (order.items[i].productId !== items[i].productId) return false;
            if (order.items[i].title !== items[i].title) return false;
            if (order.items[i].quantity !== items[i].quantity) return false;
            if (order.items[i].unitPrice !== items[i].unitPrice) return false;
          }

          // 4. Subtotal matches what was passed in
          if (order.subtotal !== subtotal) return false;

          // 5. id is a non-empty string (UUID format)
          const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (!order.id || !uuidRegex.test(order.id)) return false;

          // 6. createdAt and updatedAt are valid ISO timestamps
          if (isNaN(Date.parse(order.createdAt))) return false;
          if (isNaN(Date.parse(order.updatedAt))) return false;

          // 7. stageHistory has exactly 1 entry with stage Order_Submitted
          if (order.stageHistory.length !== 1) return false;
          if (order.stageHistory[0].stage !== "Order_Submitted") return false;
          if (isNaN(Date.parse(order.stageHistory[0].timestamp))) return false;

          // 8. The order is persisted in localStorage under key bambu_whatsapp_orders
          const raw = localStorage.getItem(STORAGE_KEY);
          if (!raw) return false;
          const persisted = JSON.parse(raw);
          if (
            !persisted.orders ||
            !Array.isArray(persisted.orders) ||
            persisted.orders.length !== 1
          ) {
            return false;
          }
          const persistedOrder = persisted.orders[0];
          if (persistedOrder.id !== order.id) return false;
          if (persistedOrder.stage !== "Order_Submitted") return false;

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
