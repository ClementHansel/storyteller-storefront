import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createOrder,
  transitionStage,
  getOrder,
  getLatestOrder,
  getAllOrders,
} from "@/lib/order-store";
import {
  composeWhatsAppMessage,
  buildWhatsAppUrl,
} from "@/lib/whatsapp-connector";
import { recordQuotation, confirmPayment } from "@/lib/order-admin-actions";

// Mock the Zenvix events API so we can verify events are fired without network calls
vi.mock("@/api/zenvix-events", () => ({
  trackEvent: vi.fn().mockResolvedValue(undefined),
  processRetryQueue: vi.fn().mockResolvedValue(undefined),
  getQueueStats: vi.fn().mockReturnValue({ pending: 0, failed: 0, total: 0 }),
  clearEventQueue: vi.fn(),
}));

import { trackEvent } from "@/api/zenvix-events";

const STORAGE_KEY = "bambu_whatsapp_orders";

function makeValidOrderData() {
  return {
    customerName: "Ana Rodriguez",
    customerEmail: "ana@example.com",
    customerPhone: "+6281234567890",
    shippingAddress: "456 Jalan Perak, Ubud, Bali 80571, Indonesia",
    items: [
      { productId: "prod-001", title: "Silver Lotus Ring", quantity: 1, unitPrice: 65 },
      { productId: "prod-002", title: "Bamboo Chain Necklace", quantity: 2, unitPrice: 85 },
    ],
    subtotal: 235,
  };
}

describe("Integration: End-to-End Checkout Flow", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("Test 1: End-to-end order creation and WhatsApp flow", () => {
    it("creates order, composes message, builds URL, and transitions stage", () => {
      // Step 1: Create order with valid data
      const orderData = makeValidOrderData();
      const order = createOrder(orderData);

      // Step 2: Verify order is at Order_Submitted in localStorage
      expect(order.stage).toBe("Order_Submitted");
      const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(persisted.orders[0].stage).toBe("Order_Submitted");
      expect(persisted.orders[0].id).toBe(order.id);

      // Step 3: Compose WhatsApp message with the order data
      const message = composeWhatsAppMessage({
        orderId: order.id,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerEmail: order.customerEmail,
        shippingAddress: order.shippingAddress,
        items: order.items.map((i) => ({
          title: i.title,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        subtotal: order.subtotal,
      });

      // Step 4: Verify message contains all fields
      expect(message).toContain(order.customerName);
      expect(message).toContain(order.customerPhone);
      expect(message).toContain(order.customerEmail);
      expect(message).toContain(order.shippingAddress);
      expect(message).toContain("Silver Lotus Ring");
      expect(message).toContain("Bamboo Chain Necklace");
      expect(message).toContain("235.00");
      expect(message).toContain(order.id);

      // Step 5: Build WhatsApp URL with the message
      const officePhone = "6281999888777";
      const url = buildWhatsAppUrl(message, officePhone);

      // Step 6: Verify URL is valid
      expect(url).toMatch(/^https:\/\/wa\.me\/6281999888777\?text=.+/);
      // Verify the encoded message decodes back correctly
      const urlObj = new URL(url);
      const decodedText = decodeURIComponent(urlObj.searchParams.get("text")!);
      expect(decodedText).toBe(message);

      // Step 7: Transition stage to Quotation_Pending
      const updated = transitionStage(order.id, "Quotation_Pending");

      // Step 8: Verify order is now at Quotation_Pending in localStorage
      expect(updated.stage).toBe("Quotation_Pending");
      const persistedAfter = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(persistedAfter.orders[0].stage).toBe("Quotation_Pending");
      expect(updated.stageHistory).toHaveLength(2);
      expect(updated.stageHistory[1].stage).toBe("Quotation_Pending");
    });
  });

  describe("Test 2: Quotation recording flow", () => {
    it("records quotation, transitions to Payment_Pending, and fires Zenvix events", async () => {
      // Step 1: Create an order and advance to Quotation_Pending
      const order = createOrder(makeValidOrderData());
      transitionStage(order.id, "Quotation_Pending");

      // Step 2: Record quotation with delivery cost and total
      const deliveryCost = 25;
      const total = 260;
      await recordQuotation(order.id, deliveryCost, total);

      // Step 3: Verify order is at Payment_Pending
      const updatedOrder = getOrder(order.id);
      expect(updatedOrder).not.toBeNull();
      expect(updatedOrder!.stage).toBe("Payment_Pending");

      // Step 4: Verify quotedDeliveryCost and quotedTotal are stored
      expect(updatedOrder!.quotedDeliveryCost).toBe(25);
      expect(updatedOrder!.quotedTotal).toBe(260);

      // Step 5: Verify Zenvix sync events were fired
      const mockTrackEvent = vi.mocked(trackEvent);
      // recordQuotation fires: stage_transition (Quotation_Pending→Quotation_Sent),
      // quotation_recorded, stage_transition (Quotation_Sent→Payment_Pending)
      const calls = mockTrackEvent.mock.calls;
      const eventTypes = calls.map((c) => c[0]);
      expect(eventTypes).toContain("order.stage_transition");
      expect(eventTypes).toContain("order.quotation_recorded");

      // Verify quotation event payload
      const quotationCall = calls.find((c) => c[0] === "order.quotation_recorded");
      expect(quotationCall).toBeDefined();
      expect(quotationCall![2]).toMatchObject({
        order_id: order.id,
        delivery_cost: 25,
        total: 260,
      });
    });
  });

  describe("Test 3: Payment confirmation flow", () => {
    it("confirms payment, transitions to Complete, and fires Zenvix events", async () => {
      // Step 1: Create an order and advance to Payment_Pending (via recordQuotation)
      const order = createOrder(makeValidOrderData());
      transitionStage(order.id, "Quotation_Pending");
      await recordQuotation(order.id, 20, 255);

      // Clear mocks to isolate payment confirmation events
      vi.clearAllMocks();

      // Step 2: Confirm payment
      const paidAmount = 255;
      await confirmPayment(order.id, paidAmount);

      // Step 3: Verify order is at Complete
      const finalOrder = getOrder(order.id);
      expect(finalOrder).not.toBeNull();
      expect(finalOrder!.stage).toBe("Complete");

      // Step 4: Verify paidAmount is stored
      expect(finalOrder!.paidAmount).toBe(255);

      // Step 5: Verify Zenvix sync events were fired
      const mockTrackEvent = vi.mocked(trackEvent);
      const calls = mockTrackEvent.mock.calls;
      const eventTypes = calls.map((c) => c[0]);
      // confirmPayment fires: stage_transition (Payment_Pending→Payment_Confirmed),
      // payment.completed, stage_transition (Payment_Confirmed→Complete)
      expect(eventTypes).toContain("order.stage_transition");
      expect(eventTypes).toContain("payment.completed");

      // Verify payment event payload
      const paymentCall = calls.find((c) => c[0] === "payment.completed");
      expect(paymentCall).toBeDefined();
      expect(paymentCall![2]).toMatchObject({
        order_id: order.id,
        amount: 255,
      });
    });
  });

  describe("Test 4: Order persistence and retrieval", () => {
    it("persists order across simulated page reloads and retrieves correctly", async () => {
      // Step 1: Create an order
      const order = createOrder(makeValidOrderData());
      expect(order.id).toBeDefined();

      // Step 2: Verify getOrder returns it
      const retrieved = getOrder(order.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(order.id);
      expect(retrieved!.customerName).toBe("Ana Rodriguez");

      // Step 3: Advance through some stages
      transitionStage(order.id, "Quotation_Pending");
      await recordQuotation(order.id, 30, 265);

      // Step 4: Verify getLatestOrder returns it with correct stage
      const latest = getLatestOrder();
      expect(latest).not.toBeNull();
      expect(latest!.id).toBe(order.id);
      expect(latest!.stage).toBe("Payment_Pending");

      // Step 5: Verify getAllOrders includes it
      const allOrders = getAllOrders();
      expect(allOrders.length).toBeGreaterThanOrEqual(1);
      expect(allOrders.some((o) => o.id === order.id)).toBe(true);

      // Step 6: Simulate page reload by re-importing the module
      // Since order-store reads from localStorage on each call (loadOrders()),
      // we verify that after a conceptual "reload", the data is still there.
      // The module reads localStorage fresh on each getOrder call, so this
      // effectively tests persistence across navigation.
      const rawData = localStorage.getItem(STORAGE_KEY);
      expect(rawData).not.toBeNull();

      // Parse and verify the raw stored data matches what we expect
      const parsed = JSON.parse(rawData!);
      expect(parsed.version).toBe(1);
      const storedOrder = parsed.orders.find(
        (o: { id: string }) => o.id === order.id
      );
      expect(storedOrder).toBeDefined();
      expect(storedOrder.stage).toBe("Payment_Pending");
      expect(storedOrder.quotedDeliveryCost).toBe(30);
      expect(storedOrder.quotedTotal).toBe(265);

      // Step 7: Verify getOrder still returns the correct data (simulating fresh read)
      const afterReload = getOrder(order.id);
      expect(afterReload).not.toBeNull();
      expect(afterReload!.stage).toBe("Payment_Pending");
      expect(afterReload!.customerName).toBe("Ana Rodriguez");
      expect(afterReload!.customerEmail).toBe("ana@example.com");
      expect(afterReload!.items).toHaveLength(2);
      expect(afterReload!.subtotal).toBe(235);
      expect(afterReload!.quotedDeliveryCost).toBe(30);
      expect(afterReload!.quotedTotal).toBe(265);
      expect(afterReload!.stageHistory.length).toBeGreaterThanOrEqual(4);
    });
  });
});
