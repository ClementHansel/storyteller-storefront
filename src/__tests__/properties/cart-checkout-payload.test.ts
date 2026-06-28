import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fc from "fast-check";
import { sendCartCheckout } from "@/api/zenvix-events";

/**
 * Feature: vps-deployment-zenvix-integration, Property 19: Cart checkout event payload completeness
 * **Validates: Requirements 9.3**
 */

const TEST_CONFIG = {
  VITE_ZENVIX_API_URL: "http://localhost:3001/api/retail/public",
  VITE_ZENVIX_TENANT_ID: "test-tenant",
  VITE_ZENVIX_CLIENT_ID: "test-client",
  VITE_ZENVIX_CLIENT_SECRET: "test-secret",
  VITE_ZENVIX_CHANNEL_RECORD_ID: "test-channel-record-id",
  VITE_ZENVIX_API_KEY: "test-api-key",
  VITE_ZENVIX_BRANCH_ID: "test-branch",
};

// Generator for cart items (1-10 items)
const cartItemArb = fc.record({
  product_id: fc.uuid(),
  quantity: fc.integer({ min: 1, max: 100 }),
  price: fc.integer({ min: 1, max: 9999900 }).map((n) => n / 100),
});

const cartItemsArb = fc.array(cartItemArb, { minLength: 1, maxLength: 10 });

describe("Property 19: Cart checkout event payload completeness", () => {
  let capturedBody: Record<string, unknown> | null = null;

  beforeEach(() => {
    capturedBody = null;
    window.__ENV__ = { ...TEST_CONFIG };
    localStorage.clear();
    sessionStorage.clear();

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
    sessionStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("payload contains all N items with correct product_id, quantity, and price", () => {
    fc.assert(
      fc.asyncProperty(cartItemsArb, async (items) => {
        capturedBody = null;
        sessionStorage.clear();

        const expectedTotal = items.reduce(
          (sum, item) => sum + item.quantity * item.price,
          0
        );

        await sendCartCheckout(items, expectedTotal);

        expect(capturedBody).not.toBeNull();

        const payload = capturedBody!.payload as Record<string, unknown>;
        const payloadItems = payload.items as Array<{
          product_id: string;
          quantity: number;
          price: number;
        }>;

        // Verify all N items are included
        expect(payloadItems).toHaveLength(items.length);

        // Verify each item has correct fields
        for (let i = 0; i < items.length; i++) {
          expect(payloadItems[i].product_id).toBe(items[i].product_id);
          expect(payloadItems[i].quantity).toBe(items[i].quantity);
          expect(payloadItems[i].price).toBe(items[i].price);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("payload total_value matches sum of (quantity * price) for all items", () => {
    fc.assert(
      fc.asyncProperty(cartItemsArb, async (items) => {
        capturedBody = null;
        sessionStorage.clear();

        const expectedTotal = items.reduce(
          (sum, item) => sum + item.quantity * item.price,
          0
        );

        await sendCartCheckout(items, expectedTotal);

        expect(capturedBody).not.toBeNull();

        const payload = capturedBody!.payload as Record<string, unknown>;
        expect(payload.total_value).toBeCloseTo(expectedTotal, 10);
      }),
      { numRuns: 100 }
    );
  });

  it("payload session_id is a non-empty string in UUID format", () => {
    fc.assert(
      fc.asyncProperty(cartItemsArb, async (items) => {
        capturedBody = null;
        sessionStorage.clear();

        const total = items.reduce(
          (sum, item) => sum + item.quantity * item.price,
          0
        );

        await sendCartCheckout(items, total);

        expect(capturedBody).not.toBeNull();

        const payload = capturedBody!.payload as Record<string, unknown>;
        const sessionId = payload.session_id as string;

        // session_id must be a non-empty string
        expect(typeof sessionId).toBe("string");
        expect(sessionId.length).toBeGreaterThan(0);

        // session_id should be a valid UUID format
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        expect(sessionId).toMatch(uuidRegex);
      }),
      { numRuns: 100 }
    );
  });
});
