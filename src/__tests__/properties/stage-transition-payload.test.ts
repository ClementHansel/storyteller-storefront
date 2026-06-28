import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fc from "fast-check";
import type { OrderStage } from "@/types/order";
import { STAGE_TO_ZENVIX } from "@/api/zenvix-stage-mapping";
import { syncStageTransition } from "@/api/zenvix-order-sync";

/**
 * Feature: vps-deployment-zenvix-integration, Property 6: Stage transition event payload correctness
 * **Validates: Requirements 5.1, 5.3**
 */

const ORDERS_STORAGE_KEY = "bambu_whatsapp_orders";

// The 5 valid consecutive stage transitions in the order lifecycle
const VALID_TRANSITIONS: Array<[OrderStage, OrderStage]> = [
  ["Order_Submitted", "Quotation_Pending"],
  ["Quotation_Pending", "Quotation_Sent"],
  ["Quotation_Sent", "Payment_Pending"],
  ["Payment_Pending", "Payment_Confirmed"],
  ["Payment_Confirmed", "Complete"],
];

// ISO 8601 regex pattern for validation
const ISO_8601_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;

describe("Property 6: Stage transition event payload correctness", () => {
  let capturedBody: Record<string, unknown> | null = null;

  beforeEach(() => {
    capturedBody = null;

    // Set up window.__ENV__ with required config
    window.__ENV__ = {
      VITE_ZENVIX_API_URL: "http://localhost:3001/api/retail/public",
      VITE_ZENVIX_TENANT_ID: "test-tenant-id",
      VITE_ZENVIX_CLIENT_ID: "test-client-id",
      VITE_ZENVIX_CLIENT_SECRET: "test-client-secret",
      VITE_ZENVIX_CHANNEL_RECORD_ID: "test-channel-record-id",
      VITE_ZENVIX_BRANCH_ID: "test-branch-id",
      VITE_ZENVIX_API_KEY: "test-api-key",
    };

    // Mock fetch to capture request body
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.body) {
        capturedBody = JSON.parse(init.body as string);
      }
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete window.__ENV__;
    localStorage.clear();
  });

  it("payload contains order_id matching the zenvixOrderId (not local id), from_stage, to_stage, and valid ISO 8601 timestamp for all valid transitions", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...VALID_TRANSITIONS),
        fc.uuid(),
        fc.uuid(),
        async ([fromStage, toStage], localOrderId, zenvixOrderId) => {
          // Clear localStorage and reset captured body for each iteration
          localStorage.clear();
          capturedBody = null;

          // Create an order in localStorage with a zenvixOrderId
          const orderData = {
            orders: [
              {
                id: localOrderId,
                stage: fromStage,
                customerName: "Test Customer",
                customerEmail: "test@example.com",
                customerPhone: "12345678901",
                shippingAddress: "123 Test Street, City",
                items: [{ productId: "prod-1", title: "Test Item", quantity: 1, unitPrice: 10.0 }],
                subtotal: 10.0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                stageHistory: [{ stage: fromStage, timestamp: new Date().toISOString() }],
                zenvixOrderId: zenvixOrderId,
                syncStatus: "synced",
                traceId: "trace-123",
                salesEventSent: false,
              },
            ],
            version: 1,
          };
          localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orderData));

          // Call syncStageTransition
          await syncStageTransition(localOrderId, fromStage, toStage);

          // Verify the captured payload
          expect(capturedBody).not.toBeNull();
          expect(capturedBody!.order_id).toBe(zenvixOrderId);
          expect(capturedBody!.from_stage).toBe(STAGE_TO_ZENVIX[fromStage]);
          expect(capturedBody!.to_stage).toBe(STAGE_TO_ZENVIX[toStage]);
          expect(typeof capturedBody!.timestamp).toBe("string");
          expect(capturedBody!.timestamp).toMatch(ISO_8601_REGEX);

          // Verify the timestamp is a valid date
          const parsedDate = new Date(capturedBody!.timestamp as string);
          expect(parsedDate.getTime()).not.toBeNaN();
        }
      ),
      { numRuns: 100 }
    );
  });
});
