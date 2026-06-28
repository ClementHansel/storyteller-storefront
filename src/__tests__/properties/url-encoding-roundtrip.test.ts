import { describe, it } from "vitest";
import * as fc from "fast-check";
import { buildWhatsAppUrl } from "@/lib/whatsapp-connector";

/**
 * Property 4: URL encoding round-trip
 *
 * For ANY message string, building a WhatsApp URL with the message and then
 * extracting and decoding the text parameter produces the original message unchanged.
 *
 * **Validates: Requirements 8.5**
 */
describe("Feature: whatsapp-checkout-flow, Property 4: URL encoding round-trip", () => {
  it("encoding then decoding the text parameter produces the original message", () => {
    const DUMMY_PHONE = "6281234567890";

    fc.assert(
      fc.property(fc.string(), (message) => {
        // Build the WhatsApp URL with the arbitrary message
        const url = buildWhatsAppUrl(message, DUMMY_PHONE);

        // Extract the text parameter from the URL
        const urlObj = new URL(url);
        const textParam = urlObj.searchParams.get("text");

        // The decoded text parameter must equal the original message
        return textParam === message;
      }),
      { numRuns: 100 }
    );
  });
});
