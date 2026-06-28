import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { validWhatsAppMessage } from "../helpers/order-generators";
import { composeWhatsAppMessage } from "@/lib/whatsapp-connector";

/**
 * Property 2: WhatsApp message content completeness
 *
 * For any valid order data (with customer name, phone, email, shipping address,
 * a list of 1+ items each with title/quantity/price, a subtotal, and an order
 * reference ID), the composed WhatsApp message SHALL contain: the customer name,
 * phone, email, shipping address, section headers for customer info/shipping/items,
 * each item's title, quantity, and unit price, the order subtotal, and the order
 * reference ID.
 *
 * **Validates: Requirements 1.2, 8.1, 8.2, 8.3, 8.4**
 */
describe("Feature: whatsapp-checkout-flow, Property 2: WhatsApp message content completeness", () => {
  it("composed message contains all required fields for any valid WhatsAppMessage data", () => {
    fc.assert(
      fc.property(validWhatsAppMessage, (data) => {
        const message = composeWhatsAppMessage(data);

        // 1. The composed message contains the customer name
        expect(message).toContain(data.customerName);

        // 2. The composed message contains the customer phone
        expect(message).toContain(data.customerPhone);

        // 3. The composed message contains the customer email
        expect(message).toContain(data.customerEmail);

        // 4. The composed message contains the shipping address
        expect(message).toContain(data.shippingAddress);

        // 5. The composed message contains section headers (Customer, Shipping Address, Items)
        expect(message).toContain("*Customer*");
        expect(message).toContain("*Shipping Address*");
        expect(message).toContain("*Items*");

        // 6. The composed message contains each item's title, quantity, and unit price
        // Note: When message is truncated, items are summarized. Check accordingly.
        const isTruncated = message.includes("items — see order");
        if (!isTruncated) {
          for (const item of data.items) {
            expect(message).toContain(item.title);
            expect(message).toContain(String(item.quantity));
            expect(message).toContain(item.unitPrice.toFixed(2));
          }
        } else {
          // When truncated, it shows item count and order reference
          expect(message).toContain(`${data.items.length} items`);
        }

        // 7. The composed message contains the subtotal
        expect(message).toContain(data.subtotal.toFixed(2));

        // 8. The composed message contains the order reference ID
        expect(message).toContain(data.orderId);
      }),
      { numRuns: 100 }
    );
  });
});
