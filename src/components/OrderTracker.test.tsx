import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { OrderTracker } from "./OrderTracker";
import { OrderRecord, OrderStage } from "@/types/order";

vi.mock("@/api/zenvix-notification-poller", () => ({
  setTrackerPageActive: vi.fn(),
}));

import { setTrackerPageActive } from "@/api/zenvix-notification-poller";

function createOrder(overrides: Partial<OrderRecord> = {}): OrderRecord {
  return {
    id: "ORD-001",
    stage: "Order_Submitted",
    customerName: "Jane Doe",
    customerEmail: "jane@example.com",
    customerPhone: "+1234567890",
    shippingAddress: "123 Main St, Springfield, IL 62704",
    items: [
      { productId: "p1", title: "Silver Ring", quantity: 2, unitPrice: 25.0 },
      { productId: "p2", title: "Bamboo Bracelet", quantity: 1, unitPrice: 40.0 },
    ],
    subtotal: 90.0,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    stageHistory: [{ stage: "Order_Submitted", timestamp: "2024-01-01T00:00:00.000Z" }],
    ...overrides,
  };
}

const ALL_STAGES: OrderStage[] = [
  "Order_Submitted",
  "Quotation_Pending",
  "Quotation_Sent",
  "Payment_Pending",
  "Payment_Confirmed",
  "Complete",
];

describe("OrderTracker", () => {
  describe("renders all 6 stages with correct visual states", () => {
    it.each(ALL_STAGES)("renders correctly when stage is %s", (stage) => {
      const order = createOrder({
        stage,
        ...(stage === "Payment_Pending" && { quotedDeliveryCost: 10.0, quotedTotal: 100.0 }),
        ...(stage === "Complete" && { paidAmount: 100.0 }),
      });

      const { container } = render(<OrderTracker order={order} />);

      // All 6 stage labels should be rendered
      expect(screen.getByText("Order Submitted")).toBeInTheDocument();
      expect(screen.getByText("Quotation Pending")).toBeInTheDocument();
      expect(screen.getByText("Quotation Sent")).toBeInTheDocument();
      expect(screen.getByText("Payment Pending")).toBeInTheDocument();
      expect(screen.getByText("Payment Confirmed")).toBeInTheDocument();
      expect(screen.getByText("Complete")).toBeInTheDocument();

      // Progress bar should be present
      expect(container.querySelector('[role="progressbar"]')).toBeInTheDocument();
    });
  });

  describe("current active stage has animate-pulse class", () => {
    it.each(ALL_STAGES)("active stage badge has animate-pulse when stage is %s", (stage) => {
      const order = createOrder({
        stage,
        ...(stage === "Payment_Pending" && { quotedDeliveryCost: 10.0, quotedTotal: 100.0 }),
        ...(stage === "Complete" && { paidAmount: 100.0 }),
      });

      const { container } = render(<OrderTracker order={order} />);

      // The active stage badge should have animate-pulse class
      const stageLabels: Record<OrderStage, string> = {
        Order_Submitted: "Order Submitted",
        Quotation_Pending: "Quotation Pending",
        Quotation_Sent: "Quotation Sent",
        Payment_Pending: "Payment Pending",
        Payment_Confirmed: "Payment Confirmed",
        Complete: "Complete",
      };

      const activeBadge = screen.getByText(stageLabels[stage]);
      expect(activeBadge).toHaveClass("animate-pulse");

      // Check that the Circle icon (active indicator) also has animate-pulse
      const animatingCircles = container.querySelectorAll(".animate-pulse");
      expect(animatingCircles.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("completed stages have green styling", () => {
    it("stages before current stage have green CheckCircle icon", () => {
      // At Payment_Pending, the first 3 stages should be completed (green)
      const order = createOrder({
        stage: "Payment_Pending",
        quotedDeliveryCost: 10.0,
        quotedTotal: 100.0,
      });

      const { container } = render(<OrderTracker order={order} />);

      // Completed stage badges have bg-green-600
      const greenBadges = container.querySelectorAll(".bg-green-600");
      // Order_Submitted, Quotation_Pending, Quotation_Sent = 3 completed stages
      expect(greenBadges.length).toBe(3);

      // CheckCircle2 icons with text-green-600 class
      const greenIcons = container.querySelectorAll(".text-green-600");
      expect(greenIcons.length).toBe(3);
    });

    it("at Complete stage, all previous 5 stages are green", () => {
      const order = createOrder({ stage: "Complete", paidAmount: 100.0 });

      const { container } = render(<OrderTracker order={order} />);

      const greenBadges = container.querySelectorAll(".bg-green-600");
      expect(greenBadges.length).toBe(5);

      const greenIcons = container.querySelectorAll(".text-green-600");
      expect(greenIcons.length).toBe(5);
    });

    it("at Order_Submitted, no stages are green (none completed)", () => {
      const order = createOrder({ stage: "Order_Submitted" });

      const { container } = render(<OrderTracker order={order} />);

      const greenBadges = container.querySelectorAll(".bg-green-600");
      expect(greenBadges.length).toBe(0);
    });
  });

  describe("contextual messages display per stage", () => {
    it("Order_Submitted shows submission success message", () => {
      const order = createOrder({ stage: "Order_Submitted" });
      render(<OrderTracker order={order} />);
      expect(screen.getByText("Your order has been submitted successfully.")).toBeInTheDocument();
    });

    it("Quotation_Pending shows review message", () => {
      const order = createOrder({ stage: "Quotation_Pending" });
      render(<OrderTracker order={order} />);
      expect(
        screen.getByText("Our office is reviewing your order and will provide a quotation shortly.")
      ).toBeInTheDocument();
    });

    it("Quotation_Sent shows review delivery costs message", () => {
      const order = createOrder({ stage: "Quotation_Sent" });
      render(<OrderTracker order={order} />);
      expect(
        screen.getByText("A quotation has been sent. Please review the delivery costs.")
      ).toBeInTheDocument();
    });

    it("Payment_Pending shows payment amount message", () => {
      const order = createOrder({
        stage: "Payment_Pending",
        quotedDeliveryCost: 15.0,
        quotedTotal: 105.0,
      });
      render(<OrderTracker order={order} />);
      expect(
        screen.getByText("Please complete payment of $105.00. Delivery cost: $15.00")
      ).toBeInTheDocument();
    });

    it("Payment_Confirmed shows processing message", () => {
      const order = createOrder({ stage: "Payment_Confirmed" });
      render(<OrderTracker order={order} />);
      expect(
        screen.getByText("Payment confirmed! Your order is being processed.")
      ).toBeInTheDocument();
    });

    it("Complete shows paid amount and reference", () => {
      const order = createOrder({
        stage: "Complete",
        paidAmount: 105.0,
        id: "ORD-ABC123",
      });
      render(<OrderTracker order={order} />);
      expect(
        screen.getByText("Order complete! Paid $105.00. Reference: #ORD-ABC123")
      ).toBeInTheDocument();
    });
  });

  describe("order details are displayed", () => {
    it("displays all items with title, quantity, and calculated price", () => {
      const order = createOrder();
      render(<OrderTracker order={order} />);

      expect(screen.getByText("Silver Ring × 2")).toBeInTheDocument();
      expect(screen.getByText("$50.00")).toBeInTheDocument();
      expect(screen.getByText("Bamboo Bracelet × 1")).toBeInTheDocument();
      expect(screen.getByText("$40.00")).toBeInTheDocument();
    });

    it("displays subtotal", () => {
      const order = createOrder({ subtotal: 90.0 });
      render(<OrderTracker order={order} />);
      expect(screen.getByText("$90.00")).toBeInTheDocument();
    });

    it("displays shipping address", () => {
      const order = createOrder({ shippingAddress: "456 Oak Ave, Portland, OR 97201" });
      render(<OrderTracker order={order} />);
      expect(screen.getByText("456 Oak Ave, Portland, OR 97201")).toBeInTheDocument();
    });

    it("displays contact info (name, email, phone)", () => {
      const order = createOrder({
        customerName: "Jane Doe",
        customerEmail: "jane@example.com",
        customerPhone: "+1234567890",
      });
      render(<OrderTracker order={order} />);
      expect(screen.getByText("Jane Doe")).toBeInTheDocument();
      expect(screen.getByText("jane@example.com")).toBeInTheDocument();
      expect(screen.getByText("+1234567890")).toBeInTheDocument();
    });
  });

  describe("quoted delivery cost and total display when available", () => {
    it("displays quoted delivery cost when quotedDeliveryCost is set", () => {
      const order = createOrder({
        stage: "Payment_Pending",
        quotedDeliveryCost: 12.5,
        quotedTotal: 102.5,
      });
      render(<OrderTracker order={order} />);
      expect(screen.getByText("$12.50")).toBeInTheDocument();
      expect(screen.getByText("Delivery Cost")).toBeInTheDocument();
    });

    it("displays quoted total when quotedTotal is set", () => {
      const order = createOrder({
        stage: "Payment_Pending",
        quotedDeliveryCost: 12.5,
        quotedTotal: 102.5,
      });
      render(<OrderTracker order={order} />);
      expect(screen.getByText("$102.50")).toBeInTheDocument();
      expect(screen.getByText("Total")).toBeInTheDocument();
    });

    it("does not display delivery cost or total when not set", () => {
      const order = createOrder({ stage: "Order_Submitted" });
      render(<OrderTracker order={order} />);
      expect(screen.queryByText("Delivery Cost")).not.toBeInTheDocument();
      expect(screen.queryByText("Total")).not.toBeInTheDocument();
    });
  });

  describe("adaptive polling frequency", () => {
    it("calls setTrackerPageActive(true) on mount", () => {
      const order = createOrder();
      render(<OrderTracker order={order} />);
      expect(setTrackerPageActive).toHaveBeenCalledWith(true);
    });

    it("calls setTrackerPageActive(false) on unmount", () => {
      const order = createOrder();
      const { unmount } = render(<OrderTracker order={order} />);
      vi.mocked(setTrackerPageActive).mockClear();
      unmount();
      expect(setTrackerPageActive).toHaveBeenCalledWith(false);
    });
  });
});
