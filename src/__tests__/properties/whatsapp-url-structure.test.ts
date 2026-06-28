import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { validWhatsAppPhone } from "../helpers/order-generators";
import { buildWhatsAppUrl } from "@/lib/whatsapp-connector";

/**
 * Property 3: WhatsApp URL structure validity
 *
 * For any composed message string and any valid office phone number (digits only,
 * 10–15 chars), the generated URL SHALL match the pattern
 * `https://wa.me/{phone}?text={encodedMessage}` where `{phone}` contains only
 * digits and `{encodedMessage}` is a valid URL-encoded string.
 *
 * **Validates: Requirements 1.3**
 */
describe("Feature: whatsapp-checkout-flow, Property 3: WhatsApp URL structure validity", () => {
  it("generated URL matches wa.me pattern for any message and valid phone number", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 500 }),
        validWhatsAppPhone,
        (message, phone) => {
          const url = buildWhatsAppUrl(message, phone);

          // 1. The URL starts with https://wa.me/
          expect(url.startsWith("https://wa.me/")).toBe(true);

          // 2. The phone number segment contains only digits
          const afterPrefix = url.slice("https://wa.me/".length);
          const phoneSegment = afterPrefix.split("?")[0];
          expect(phoneSegment).toMatch(/^\d+$/);
          expect(phoneSegment).toBe(phone);

          // 3. The URL contains ?text=
          expect(url).toContain("?text=");

          // 4. The text parameter is properly URL-encoded
          const textParam = url.split("?text=")[1];
          expect(textParam).toBeDefined();
          expect(textParam).toBe(encodeURIComponent(message));

          // 5. The overall URL matches the pattern https://wa.me/{digits}?text={encodedString}
          const fullPattern = /^https:\/\/wa\.me\/\d+\?text=.+$/;
          expect(url).toMatch(fullPattern);
        }
      ),
      { numRuns: 100 }
    );
  });
});
