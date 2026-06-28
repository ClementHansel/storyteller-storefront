import { describe, it, expect, beforeEach } from "vitest";
import { createOrder, transitionStage, getOrder, getLatestOrder, getAllOrders } from "./order-store";

const STORAGE_KEY = "bambu_whatsapp_orders";

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

describe("OrderStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("createOrder", () => {
    it("creates an order with stage Order_Submitted", () => {
      const order = createOrder(makeOrderData());

      expect(order.stage).toBe("Order_Submitted");
      expect(order.id).toBeDefined();
      expect(order.id.length).toBeGreaterThan(0);
    });

    it("persists order to localStorage", () => {
      const order = createOrder(makeOrderData());

      const raw = localStorage.getItem(STORAGE_KEY);
      expect(raw).not.toBeNull();

      const parsed = JSON.parse(raw!);
      expect(parsed.version).toBe(1);
      expect(parsed.orders).toHaveLength(1);
      expect(parsed.orders[0].id).toBe(order.id);
    });

    it("preserves all customer fields and items", () => {
      const data = makeOrderData();
      const order = createOrder(data);

      expect(order.customerName).toBe(data.customerName);
      expect(order.customerEmail).toBe(data.customerEmail);
      expect(order.customerPhone).toBe(data.customerPhone);
      expect(order.shippingAddress).toBe(data.shippingAddress);
      expect(order.items).toEqual(data.items);
      expect(order.subtotal).toBe(data.subtotal);
    });

    it("sets valid timestamps and initial stageHistory", () => {
      const order = createOrder(makeOrderData());

      expect(order.createdAt).toBeDefined();
      expect(order.updatedAt).toBeDefined();
      expect(new Date(order.createdAt).getTime()).not.toBeNaN();
      expect(order.stageHistory).toHaveLength(1);
      expect(order.stageHistory[0].stage).toBe("Order_Submitted");
    });

    it("generates unique IDs for multiple orders", () => {
      const order1 = createOrder(makeOrderData());
      const order2 = createOrder(makeOrderData());

      expect(order1.id).not.toBe(order2.id);
    });
  });

  describe("transitionStage", () => {
    it("transitions Order_Submitted → Quotation_Pending", () => {
      const order = createOrder(makeOrderData());
      const updated = transitionStage(order.id, "Quotation_Pending");

      expect(updated.stage).toBe("Quotation_Pending");
      expect(updated.stageHistory).toHaveLength(2);
      expect(updated.stageHistory[1].stage).toBe("Quotation_Pending");
    });

    it("completes the full stage lifecycle", () => {
      const order = createOrder(makeOrderData());
      transitionStage(order.id, "Quotation_Pending");
      transitionStage(order.id, "Quotation_Sent");
      transitionStage(order.id, "Payment_Pending");
      transitionStage(order.id, "Payment_Confirmed");
      const completed = transitionStage(order.id, "Complete");

      expect(completed.stage).toBe("Complete");
      expect(completed.stageHistory).toHaveLength(6);
    });

    it("throws on invalid transition", () => {
      const order = createOrder(makeOrderData());

      expect(() => transitionStage(order.id, "Complete")).toThrow(
        /Invalid stage transition/
      );
    });

    it("throws on non-existent order", () => {
      expect(() => transitionStage("non-existent-id", "Quotation_Pending")).toThrow(
        /Order not found/
      );
    });

    it("throws when transitioning from terminal stage", () => {
      const order = createOrder(makeOrderData());
      transitionStage(order.id, "Quotation_Pending");
      transitionStage(order.id, "Quotation_Sent");
      transitionStage(order.id, "Payment_Pending");
      transitionStage(order.id, "Payment_Confirmed");
      transitionStage(order.id, "Complete");

      expect(() => transitionStage(order.id, "Order_Submitted")).toThrow(
        /Invalid stage transition/
      );
    });

    it("merges metadata into the order", () => {
      const order = createOrder(makeOrderData());
      transitionStage(order.id, "Quotation_Pending");
      const updated = transitionStage(order.id, "Quotation_Sent", {
        quotedDeliveryCost: 15,
        quotedTotal: 135,
      });

      expect(updated.quotedDeliveryCost).toBe(15);
      expect(updated.quotedTotal).toBe(135);
    });

    it("does not allow metadata to overwrite order id", () => {
      const order = createOrder(makeOrderData());
      const updated = transitionStage(order.id, "Quotation_Pending", {
        id: "hacked-id",
      } as Partial<typeof order>);

      expect(updated.id).toBe(order.id);
    });

    it("updates the persisted data", () => {
      const order = createOrder(makeOrderData());
      transitionStage(order.id, "Quotation_Pending");

      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = JSON.parse(raw!);
      expect(parsed.orders[0].stage).toBe("Quotation_Pending");
    });
  });

  describe("getOrder", () => {
    it("returns order by ID", () => {
      const order = createOrder(makeOrderData());
      const found = getOrder(order.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(order.id);
    });

    it("returns null for non-existent ID", () => {
      expect(getOrder("non-existent")).toBeNull();
    });
  });

  describe("getLatestOrder", () => {
    it("returns null when no orders exist", () => {
      expect(getLatestOrder()).toBeNull();
    });

    it("returns the most recently created order", () => {
      createOrder(makeOrderData());
      const second = createOrder({ ...makeOrderData(), customerName: "Second" });

      const latest = getLatestOrder();
      expect(latest).not.toBeNull();
      expect(latest!.id).toBe(second.id);
      expect(latest!.customerName).toBe("Second");
    });
  });

  describe("getAllOrders", () => {
    it("returns empty array when no orders exist", () => {
      expect(getAllOrders()).toEqual([]);
    });

    it("returns all created orders", () => {
      createOrder(makeOrderData());
      createOrder(makeOrderData());
      createOrder(makeOrderData());

      expect(getAllOrders()).toHaveLength(3);
    });
  });
});
