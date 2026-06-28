import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fc from "fast-check";
import { syncQuotationRecorded, syncPaymentCompleted } from "@/api/zenvix-order-sync";

/**
 * Feature: vps-deployment-zenvix-integration, Property 10: Quotation and payment event payload correctness
 * **Validates: Requirements 6.1, 6.2, 6.3**
 */

const ISO_8601_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;

const TEST_CONFIG = {
  VITE_ZENVIX_API_URL: "http://localhost:3001/api/retail/public",
  VITE_ZENVIX_TENANT_ID: "test-tenant",
  VITE_ZENVIX_CLIENT_ID: "test-client",
  VITE_ZENVIX_CLIENT_SECRET: "test-secret",
  VITE_ZENVIX_CHANNEL_RECORD_ID: "test-channel-123",
  VITE_ZENVIX_API_KEY: "test-api-key",
  VITE_ZENVIX_BRANCH_ID: "test-branch",
};

const TEST_ORDER_ID = "test-order-001";
const TEST_ZENVIX_ORDER_ID = "zenvix-order-abc-123";

function setupLocalStorageOrder() {
  const orderData = {
    orders: [
      {
        id: TEST_ORDER_ID,
        stage: "Payment_Pending",
        customerName: "Test Customer",
        customerEmail: "test@example.com",
        customerPhone: "12345678901",
        shippingAddress: "123 Test Street, City",
        items: [{ productId: "prod-1", title: "Silver Ring", quantity: 1, unitPrice: 50.0 }],
        subtotal: 50.0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stageHistory: [{ stage: "Order_Submitted", timestamp: new Date().toISOString() }],
        zenvixOrderId: TEST_ZENVIX_ORDER_ID,
        syncStatus: "synced",
        traceId: "trace-uuid-001",
        salesEventSent: false,
      },
    ],
    version: 1,
  };
  localStorage.setItem("bambu_whatsapp_orders", JSON.stringify(orderData));
}

describe("Property 10: Quotation and payment event payload correctness", () => {
  let capturedBody: Record<string, unknown> | null = null;

  beforeEach(() => {
    capturedBody = null;
    window.__ENV__ = { ...TEST_CONFIG };
    localStorage.clear();
    setupLocalStorageOrder();

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

  it("quotation payload contains order_id, delivery_cost, total, and ISO 8601 timestamp", () => {
    fc.assert(
      fc.asyncProperty(
        // Generate delivery costs as integers mapped to /100 for ≤2 decimal places
        fc.integer({ min: 0, max: 9999900 }).map((n) => n / 100),
        // Generate totals similarly
        fc.integer({ min: 1, max: 9999900 }).map((n) => n / 100),
        async (deliveryCost, total) => {
          capturedBody = null;
          // Reset localStorage before each iteration
          setupLocalStorageOrder();

          await syncQuotationRecorded(TEST_ORDER_ID, deliveryCost, total);

          expect(capturedBody).not.toBeNull();

          // Verify event_type
          expect(capturedBody!.event_type).toBe("order.quotation_recorded");

          // Verify order_id is present and matches
          expect(capturedBody!.order_id).toBe(TEST_ZENVIX_ORDER_ID);

          // Verify delivery_cost is the correct numeric value with ≤2 decimal places
          expect(capturedBody!.delivery_cost).toBe(deliveryCost);
          expect(typeof capturedBody!.delivery_cost).toBe("number");
          const deliveryCostStr = String(capturedBody!.delivery_cost);
          const deliveryDecimalParts = deliveryCostStr.split(".");
          if (deliveryDecimalParts.length === 2) {
            expect(deliveryDecimalParts[1].length).toBeLessThanOrEqual(2);
          }

          // Verify total is the correct numeric value with ≤2 decimal places
          expect(capturedBody!.total).toBe(total);
          expect(typeof capturedBody!.total).toBe("number");
          const totalStr = String(capturedBody!.total);
          const totalDecimalParts = totalStr.split(".");
          if (totalDecimalParts.length === 2) {
            expect(totalDecimalParts[1].length).toBeLessThanOrEqual(2);
          }

          // Verify timestamp is ISO 8601
          expect(capturedBody!.timestamp).toBeDefined();
          expect(typeof capturedBody!.timestamp).toBe("string");
          expect(capturedBody!.timestamp).toMatch(ISO_8601_REGEX);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("payment payload contains order_id, amount, and ISO 8601 timestamp", () => {
    fc.assert(
      fc.asyncProperty(
        // Generate payment amounts as integers mapped to /100 for ≤2 decimal places
        fc.integer({ min: 1, max: 9999900 }).map((n) => n / 100),
        async (amount) => {
          capturedBody = null;
          // Reset localStorage before each iteration
          setupLocalStorageOrder();

          await syncPaymentCompleted(TEST_ORDER_ID, amount);

          expect(capturedBody).not.toBeNull();

          // Verify event_type
          expect(capturedBody!.event_type).toBe("payment.completed");

          // Verify order_id is present and matches
          expect(capturedBody!.order_id).toBe(TEST_ZENVIX_ORDER_ID);

          // Verify amount is the correct numeric value with ≤2 decimal places
          expect(capturedBody!.amount).toBe(amount);
          expect(typeof capturedBody!.amount).toBe("number");
          const amountStr = String(capturedBody!.amount);
          const amountDecimalParts = amountStr.split(".");
          if (amountDecimalParts.length === 2) {
            expect(amountDecimalParts[1].length).toBeLessThanOrEqual(2);
          }

          // Verify timestamp is ISO 8601
          expect(capturedBody!.timestamp).toBeDefined();
          expect(typeof capturedBody!.timestamp).toBe("string");
          expect(capturedBody!.timestamp).toMatch(ISO_8601_REGEX);
        }
      ),
      { numRuns: 100 }
    );
  });
});
