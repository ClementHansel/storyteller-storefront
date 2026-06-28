import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { validOrderRecord } from "@/__tests__/helpers/order-generators";
import { buildOrderCreationPayload } from "@/api/zenvix-order-sync";

/**
 * Feature: vps-deployment-zenvix-integration, Property 1: Order sync payload contains all required fields
 * **Validates: Requirements 4.1, 4.5**
 */

const TEST_CHANNEL_RECORD_ID = "test-channel-record-abc-123";

describe("Property 1: Order sync payload contains all required fields", () => {
  beforeEach(() => {
    window.__ENV__ = {
      VITE_ZENVIX_CHANNEL_RECORD_ID: TEST_CHANNEL_RECORD_ID,
    };
  });

  afterEach(() => {
    delete window.__ENV__;
  });

  it("payload items array matches order items with sku = productId and correct quantity", () => {
    fc.assert(
      fc.property(validOrderRecord, (order) => {
        const payload = buildOrderCreationPayload(order);

        expect(payload.items).toHaveLength(order.items.length);
        for (let i = 0; i < order.items.length; i++) {
          expect(payload.items[i].sku).toBe(order.items[i].productId);
          expect(payload.items[i].quantity).toBe(order.items[i].quantity);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("payload customer has email and name matching the order", () => {
    fc.assert(
      fc.property(validOrderRecord, (order) => {
        const payload = buildOrderCreationPayload(order);

        expect(payload.customer.email).toBe(order.customerEmail);
        expect(payload.customer.name).toBe(order.customerName);
      }),
      { numRuns: 100 }
    );
  });

  it("payload payment_status is always 'PENDING'", () => {
    fc.assert(
      fc.property(validOrderRecord, (order) => {
        const payload = buildOrderCreationPayload(order);

        expect(payload.payment_status).toBe("PENDING");
      }),
      { numRuns: 100 }
    );
  });

  it("payload channel_record_id matches configured VITE_ZENVIX_CHANNEL_RECORD_ID", () => {
    fc.assert(
      fc.property(validOrderRecord, (order) => {
        const payload = buildOrderCreationPayload(order);

        expect(payload.channel_record_id).toBe(TEST_CHANNEL_RECORD_ID);
        expect(typeof payload.channel_record_id).toBe("string");
        expect(payload.channel_record_id.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });
});
