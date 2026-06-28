import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fc from "fast-check";
import { syncSalesCompletion } from "@/api/zenvix-order-sync";
import { validOrderRecordItemList } from "@/__tests__/helpers/order-generators";
import type { OrderRecord } from "@/types/order";

/**
 * Feature: vps-deployment-zenvix-integration, Property 16: Sales completion event payload correctness
 * **Validates: Requirements 8.1, 8.2, 8.3**
 */

const TEST_CHANNEL_RECORD_ID = "test-channel-record-sales-456";

const TEST_CONFIG = {
  VITE_ZENVIX_API_URL: "http://localhost:3001/api/retail/public",
  VITE_ZENVIX_TENANT_ID: "test-tenant",
  VITE_ZENVIX_CLIENT_ID: "test-client",
  VITE_ZENVIX_CLIENT_SECRET: "test-secret",
  VITE_ZENVIX_CHANNEL_RECORD_ID: TEST_CHANNEL_RECORD_ID,
  VITE_ZENVIX_API_KEY: "test-api-key",
  VITE_ZENVIX_BRANCH_ID: "test-branch",
};

// Generator for a completed order with random items, paidAmount, quotedDeliveryCost
const completedOrderArb: fc.Arbitrary<OrderRecord> = fc
  .record({
    id: fc.uuid(),
    items: validOrderRecordItemList,
    customerName: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
    customerEmail: fc
      .tuple(
        fc.stringMatching(/^[a-z][a-z0-9._]{0,9}$/),
        fc.stringMatching(/^[a-z][a-z0-9]{0,5}$/),
        fc.constantFrom("com", "org", "net")
      )
      .map(([local, domain, tld]) => `${local}@${domain}.${tld}`),
    customerPhone: fc.string({ minLength: 5, maxLength: 15 }).filter((s) => s.trim().length >= 5),
    shippingAddress: fc.string({ minLength: 10, maxLength: 100 }).filter((s) => s.trim().length >= 10),
    subtotal: fc.integer({ min: 100, max: 9999900 }).map((n) => n / 100),
    paidAmount: fc.option(
      fc.integer({ min: 100, max: 9999900 }).map((n) => n / 100),
      { nil: undefined }
    ),
    quotedDeliveryCost: fc.option(
      fc.integer({ min: 0, max: 500000 }).map((n) => n / 100),
      { nil: undefined }
    ),
    createdAt: fc.constant(new Date().toISOString()),
    updatedAt: fc.constant(new Date().toISOString()),
  })
  .map((record) => ({
    ...record,
    stage: "Complete" as const,
    stageHistory: [{ stage: "Complete" as const, timestamp: record.createdAt }],
    salesEventSent: false,
    syncStatus: "synced" as const,
    zenvixOrderId: "zenvix-order-" + record.id,
    traceId: "trace-" + record.id,
  }));

function setupLocalStorageForOrder(order: OrderRecord) {
  const orderData = {
    orders: [order],
    version: 1,
  };
  localStorage.setItem("bambu_whatsapp_orders", JSON.stringify(orderData));
}

describe("Property 16: Sales completion event payload correctness", () => {
  let capturedBody: Record<string, unknown> | null = null;

  beforeEach(() => {
    capturedBody = null;
    window.__ENV__ = { ...TEST_CONFIG };
    localStorage.clear();

    // Mock fetch to capture the request body and return success
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init?: RequestInit) => {
        if (init?.body) {
          capturedBody = JSON.parse(init.body as string);
        }
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      })
    );

    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "debug").mockImplementation(() => {});
  });

  afterEach(() => {
    delete window.__ENV__;
    localStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("payload items match order items with product_id, quantity, and unit_price", () => {
    fc.assert(
      fc.asyncProperty(completedOrderArb, async (order) => {
        capturedBody = null;
        setupLocalStorageForOrder(order);

        await syncSalesCompletion(order);

        expect(capturedBody).not.toBeNull();

        const items = capturedBody!.items as Array<{
          product_id: string;
          quantity: number;
          unit_price: number;
        }>;

        // Verify items array length matches
        expect(items).toHaveLength(order.items.length);

        // Verify each item has correct product_id, quantity, unit_price
        for (let i = 0; i < order.items.length; i++) {
          expect(items[i].product_id).toBe(order.items[i].productId);
          expect(items[i].quantity).toBe(order.items[i].quantity);
          expect(items[i].unit_price).toBe(order.items[i].unitPrice);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("payload total equals (paidAmount || subtotal) + (quotedDeliveryCost || 0)", () => {
    fc.assert(
      fc.asyncProperty(completedOrderArb, async (order) => {
        capturedBody = null;
        setupLocalStorageForOrder(order);

        await syncSalesCompletion(order);

        expect(capturedBody).not.toBeNull();

        const expectedTotal =
          (order.paidAmount || order.subtotal) + (order.quotedDeliveryCost || 0);

        expect(capturedBody!.total).toBeCloseTo(expectedTotal, 10);
      }),
      { numRuns: 100 }
    );
  });

  it("payload customer contains name and email matching the order", () => {
    fc.assert(
      fc.asyncProperty(completedOrderArb, async (order) => {
        capturedBody = null;
        setupLocalStorageForOrder(order);

        await syncSalesCompletion(order);

        expect(capturedBody).not.toBeNull();

        const customer = capturedBody!.customer as { name: string; email: string };

        expect(customer).toBeDefined();
        expect(customer.name).toBe(order.customerName);
        expect(customer.email).toBe(order.customerEmail);
      }),
      { numRuns: 100 }
    );
  });

  it("payload channel_record_id matches configured VITE_ZENVIX_CHANNEL_RECORD_ID", () => {
    fc.assert(
      fc.asyncProperty(completedOrderArb, async (order) => {
        capturedBody = null;
        setupLocalStorageForOrder(order);

        await syncSalesCompletion(order);

        expect(capturedBody).not.toBeNull();

        expect(capturedBody!.channel_record_id).toBe(TEST_CHANNEL_RECORD_ID);
      }),
      { numRuns: 100 }
    );
  });
});
