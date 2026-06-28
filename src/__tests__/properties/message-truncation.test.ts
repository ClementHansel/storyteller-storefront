import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { longWhatsAppMessage } from "../helpers/order-generators";
import { composeWhatsAppMessage } from "@/lib/whatsapp-connector";

/**
 * Property 5: Message truncation preserves order reference and subtotal
 *
 * For any order data that produces a composed message exceeding 1000 characters
 * (e.g., orders with many items or long descriptions), the truncated message
 * SHALL be ≤1000 characters AND still contain the order reference ID and the
 * subtotal value.
 *
 * **Validates: Requirements 8.6**
 */
describe("Feature: whatsapp-checkout-flow, Property 5: Message truncation preserves order reference and subtotal", () => {
  it("truncated message is ≤1000 encoded chars and preserves order ID and subtotal", () => {
    fc.assert(
      fc.property(longWhatsAppMessage, (data) => {
        // First verify the full (non-truncated) message WOULD exceed 1000 chars when encoded
        const itemLines = data.items
          .map((item) => `• ${item.title} × ${item.quantity} — $${item.unitPrice.toFixed(2)}`)
          .join("\n");

        const fullMessage = [
          `🛒 *New Order — #${data.orderId}*`,
          "",
          `👤 *Customer*`,
          `Name: ${data.customerName}`,
          `Phone: ${data.customerPhone}`,
          `Email: ${data.customerEmail}`,
          "",
          `📍 *Shipping Address*`,
          data.shippingAddress,
          "",
          `📦 *Items*`,
          itemLines,
          "",
          `💰 *Subtotal: $${data.subtotal.toFixed(2)}*`,
          "",
          `📋 Please provide a quotation including delivery costs.`,
        ].join("\n");

        const fullEncodedLength = encodeURIComponent(fullMessage).length;

        // Precondition: the full message must exceed 1000 chars when encoded
        fc.pre(fullEncodedLength > 1000);

        // Now compose the message (which should trigger truncation)
        const message = composeWhatsAppMessage(data);
        const encodedLength = encodeURIComponent(message).length;

        // 1. The encoded message is ≤1000 characters
        expect(encodedLength).toBeLessThanOrEqual(1000);

        // 2. The message still contains the order reference ID
        expect(message).toContain(data.orderId);

        // 3. The message still contains the subtotal value
        expect(message).toContain(data.subtotal.toFixed(2));
      }),
      { numRuns: 100 }
    );
  });
});
