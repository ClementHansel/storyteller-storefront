import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  validCheckoutFormData,
  invalidCheckoutFormData,
  validOrderRecord,
  validItemList,
  validOrderRecordItemList,
  validWhatsAppPhone,
  invalidWhatsAppPhone,
  validWhatsAppMessage,
  longWhatsAppMessage,
} from "./order-generators";

describe("order-generators sanity checks", () => {
  it("generates valid checkout form data", () => {
    fc.assert(
      fc.property(validCheckoutFormData, (data) => {
        expect(data.customerName.trim().length).toBeGreaterThan(0);
        expect(data.customerEmail).toContain("@");
        expect(data.customerPhone.trim().length).toBeGreaterThanOrEqual(5);
        expect(data.shippingAddress.trim().length).toBeGreaterThanOrEqual(10);
      }),
      { numRuns: 100 }
    );
  });

  it("generates invalid checkout form data with at least one invalid field", () => {
    fc.assert(
      fc.property(invalidCheckoutFormData, (data) => {
        const nameValid = data.customerName.trim().length > 0;
        const emailValid = data.customerEmail.includes("@");
        const phoneValid = data.customerPhone.trim().length >= 5;
        const addressValid = data.shippingAddress.trim().length >= 10;
        // At least one field should be invalid
        expect(nameValid && emailValid && phoneValid && addressValid).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("generates valid order records with all fields", () => {
    fc.assert(
      fc.property(validOrderRecord, (order) => {
        expect(order.id).toBeTruthy();
        expect(order.stage).toBeTruthy();
        expect(order.customerName.trim().length).toBeGreaterThan(0);
        expect(order.items.length).toBeGreaterThan(0);
        expect(order.stageHistory.length).toBeGreaterThan(0);
        expect(order.createdAt).toBeTruthy();
        expect(order.updatedAt).toBeTruthy();
      }),
      { numRuns: 100 }
    );
  });

  it("generates valid item lists", () => {
    fc.assert(
      fc.property(validItemList, (items) => {
        expect(items.length).toBeGreaterThan(0);
        items.forEach((item) => {
          expect(item.title.trim().length).toBeGreaterThan(0);
          expect(item.quantity).toBeGreaterThanOrEqual(1);
          expect(item.unitPrice).toBeGreaterThan(0);
        });
      }),
      { numRuns: 100 }
    );
  });

  it("generates valid order record item lists (with productId)", () => {
    fc.assert(
      fc.property(validOrderRecordItemList, (items) => {
        expect(items.length).toBeGreaterThan(0);
        items.forEach((item) => {
          expect(item.productId).toBeTruthy();
          expect(item.title.trim().length).toBeGreaterThan(0);
          expect(item.quantity).toBeGreaterThanOrEqual(1);
          expect(item.unitPrice).toBeGreaterThan(0);
        });
      }),
      { numRuns: 100 }
    );
  });

  it("generates valid WhatsApp phone numbers (10-15 digits)", () => {
    fc.assert(
      fc.property(validWhatsAppPhone, (phone) => {
        expect(phone).toMatch(/^\d{10,15}$/);
      }),
      { numRuns: 100 }
    );
  });

  it("generates invalid WhatsApp phone numbers", () => {
    fc.assert(
      fc.property(invalidWhatsAppPhone, (phone) => {
        const isValidFormat = /^\d{10,15}$/.test(phone);
        expect(isValidFormat).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("generates valid WhatsApp message data", () => {
    fc.assert(
      fc.property(validWhatsAppMessage, (msg) => {
        expect(msg.orderId).toBeTruthy();
        expect(msg.customerName.trim().length).toBeGreaterThan(0);
        expect(msg.customerEmail).toContain("@");
        expect(msg.items.length).toBeGreaterThan(0);
        expect(msg.subtotal).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it("generates long WhatsApp messages with many items", () => {
    fc.assert(
      fc.property(longWhatsAppMessage, (msg) => {
        expect(msg.items.length).toBeGreaterThanOrEqual(15);
        msg.items.forEach((item) => {
          expect(item.title.trim().length).toBeGreaterThanOrEqual(20);
        });
      }),
      { numRuns: 20 }
    );
  });
});
