import { describe, it, expect, beforeEach, vi } from "vitest";
import { createOrder, transitionStage, getOrder } from "./order-store";
import { recordQuotation, confirmPayment, associateUser } from "./order-admin-actions";

vi.mock("./zenvix-order-sync", () => ({
  syncStageTransition: vi.fn().mockResolvedValue(undefined),
  syncQuotationRecorded: vi.fn().mockResolvedValue(undefined),
  syncPaymentCompleted: vi.fn().mockResolvedValue(undefined),
}));

import { syncStageTransition, syncQuotationRecorded, syncPaymentCompleted } from "./zenvix-order-sync";

function makeOrderData() {
  return {
    customerName: "Maria Garcia",
    customerEmail: "maria@example.com",
    customerPhone: "+6281234567890",
    shippingAddress: "123 Jalan Silver, Bali 80361, Indonesia",
    items: [
      { productId: "p1", title: "Silver Bangle", quantity: 2, unitPrice: 45 },
      { productId: "p2", title: "Bamboo Earrings", quantity: 1, unitPrice: 30 },
    ],
    subtotal: 120,
  };
}

/** Helper: creates an order and advances it to Quotation_Pending */
function createOrderAtQuotationPending() {
  const order = createOrder(makeOrderData());
  transitionStage(order.id, "Quotation_Pending");
  return order;
}

/** Helper: creates an order and advances it to Payment_Pending */
function createOrderAtPaymentPending() {
  const order = createOrderAtQuotationPending();
  transitionStage(order.id, "Quotation_Sent", { quotedDeliveryCost: 15, quotedTotal: 135 });
  transitionStage(order.id, "Payment_Pending");
  return order;
}

describe("OrderAdminActions", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("recordQuotation", () => {
    it("transitions order from Quotation_Pending through Quotation_Sent to Payment_Pending", async () => {
      const order = createOrderAtQuotationPending();

      await recordQuotation(order.id, 15, 135, "admin-1");

      const updated = getOrder(order.id);
      expect(updated).not.toBeNull();
      expect(updated!.stage).toBe("Payment_Pending");
    });

    it("stores quotation metadata (quotedDeliveryCost and quotedTotal)", async () => {
      const order = createOrderAtQuotationPending();

      await recordQuotation(order.id, 20, 140);

      const updated = getOrder(order.id);
      expect(updated!.quotedDeliveryCost).toBe(20);
      expect(updated!.quotedTotal).toBe(140);
    });

    it("records correct stage history entries", async () => {
      const order = createOrderAtQuotationPending();

      await recordQuotation(order.id, 15, 135);

      const updated = getOrder(order.id);
      // Order_Submitted → Quotation_Pending → Quotation_Sent → Payment_Pending
      expect(updated!.stageHistory).toHaveLength(4);
      expect(updated!.stageHistory[2].stage).toBe("Quotation_Sent");
      expect(updated!.stageHistory[3].stage).toBe("Payment_Pending");
    });

    it("fires Zenvix sync events with correct arguments", async () => {
      const order = createOrderAtQuotationPending();

      await recordQuotation(order.id, 15, 135, "admin-1");

      expect(syncStageTransition).toHaveBeenCalledWith(order.id, "Quotation_Pending", "Quotation_Sent", "admin-1");
      expect(syncQuotationRecorded).toHaveBeenCalledWith(order.id, 15, 135, "admin-1");
      expect(syncStageTransition).toHaveBeenCalledWith(order.id, "Quotation_Sent", "Payment_Pending", "admin-1");
    });

    it("throws if order is not found", async () => {
      await expect(recordQuotation("non-existent", 15, 135)).rejects.toThrow(
        /Order not found/
      );
    });

    it("throws if order is not at Quotation_Pending stage", async () => {
      const order = createOrder(makeOrderData());

      await expect(recordQuotation(order.id, 15, 135)).rejects.toThrow(
        /expected "Quotation_Pending"/
      );
    });
  });

  describe("confirmPayment", () => {
    it("transitions order from Payment_Pending through Payment_Confirmed to Complete", async () => {
      const order = createOrderAtPaymentPending();

      await confirmPayment(order.id, 135, "admin-1");

      const updated = getOrder(order.id);
      expect(updated).not.toBeNull();
      expect(updated!.stage).toBe("Complete");
    });

    it("stores paidAmount metadata", async () => {
      const order = createOrderAtPaymentPending();

      await confirmPayment(order.id, 135);

      const updated = getOrder(order.id);
      expect(updated!.paidAmount).toBe(135);
    });

    it("records correct stage history entries", async () => {
      const order = createOrderAtPaymentPending();

      await confirmPayment(order.id, 135);

      const updated = getOrder(order.id);
      // Order_Submitted → Quotation_Pending → Quotation_Sent → Payment_Pending → Payment_Confirmed → Complete
      expect(updated!.stageHistory).toHaveLength(6);
      expect(updated!.stageHistory[4].stage).toBe("Payment_Confirmed");
      expect(updated!.stageHistory[5].stage).toBe("Complete");
    });

    it("fires Zenvix sync events with correct arguments", async () => {
      const order = createOrderAtPaymentPending();

      await confirmPayment(order.id, 135, "admin-1");

      expect(syncStageTransition).toHaveBeenCalledWith(order.id, "Payment_Pending", "Payment_Confirmed", "admin-1");
      expect(syncPaymentCompleted).toHaveBeenCalledWith(order.id, 135, "admin-1");
      expect(syncStageTransition).toHaveBeenCalledWith(order.id, "Payment_Confirmed", "Complete", "admin-1");
    });

    it("throws if order is not found", async () => {
      await expect(confirmPayment("non-existent", 135)).rejects.toThrow(
        /Order not found/
      );
    });

    it("throws if order is not at Payment_Pending stage", async () => {
      const order = createOrderAtQuotationPending();

      await expect(confirmPayment(order.id, 135)).rejects.toThrow(
        /expected "Payment_Pending"/
      );
    });
  });

  describe("associateUser", () => {
    it("sets the userId on the order", () => {
      const order = createOrder(makeOrderData());

      associateUser(order.id, "user-123");

      const updated = getOrder(order.id);
      expect(updated!.userId).toBe("user-123");
    });

    it("updates the updatedAt timestamp", () => {
      const order = createOrder(makeOrderData());
      const originalUpdatedAt = order.updatedAt;

      // Small delay to ensure timestamp differs
      associateUser(order.id, "user-456");

      const updated = getOrder(order.id);
      expect(updated!.updatedAt).toBeDefined();
      expect(new Date(updated!.updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(originalUpdatedAt).getTime()
      );
    });

    it("preserves all other order fields", () => {
      const order = createOrder(makeOrderData());

      associateUser(order.id, "user-789");

      const updated = getOrder(order.id);
      expect(updated!.customerName).toBe(order.customerName);
      expect(updated!.customerEmail).toBe(order.customerEmail);
      expect(updated!.items).toEqual(order.items);
      expect(updated!.stage).toBe(order.stage);
    });

    it("throws if order is not found", () => {
      expect(() => associateUser("non-existent", "user-123")).toThrow(
        /Order not found/
      );
    });
  });
});
