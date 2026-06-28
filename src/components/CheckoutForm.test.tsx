import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CheckoutForm } from "./CheckoutForm";

// Mock order-store module
vi.mock("@/lib/order-store", () => ({
  createOrder: vi.fn(),
  transitionStage: vi.fn(),
}));

// Mock whatsapp-connector module
vi.mock("@/lib/whatsapp-connector", () => ({
  openWhatsAppCheckout: vi.fn(),
}));

// Mock Zenvix order sync module
vi.mock("@/api/zenvix-order-sync", () => ({
  syncOrderCreation: vi.fn().mockResolvedValue(undefined),
  processSyncQueue: vi.fn().mockResolvedValue(undefined),
}));

// Mock Zenvix audit logger module
vi.mock("@/api/zenvix-audit-logger", () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
  createAuditEntry: vi.fn().mockReturnValue({
    action: 'order.created',
    order_id: 'test',
    trace_id: 'test-trace',
    actor: { id: 'test', type: 'customer' },
    timestamp: new Date().toISOString(),
  }),
}));

// Mock Zenvix notification poller module
vi.mock("@/api/zenvix-notification-poller", () => ({
  startPolling: vi.fn(),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

import { createOrder, transitionStage } from "@/lib/order-store";
import { openWhatsAppCheckout } from "@/lib/whatsapp-connector";
import { syncOrderCreation, processSyncQueue } from "@/api/zenvix-order-sync";
import { logAudit, createAuditEntry } from "@/api/zenvix-audit-logger";
import { startPolling } from "@/api/zenvix-notification-poller";
import { toast } from "sonner";

const mockItems = [
  { productId: "p1", title: "Silver Ring", quantity: 2, unitPrice: 45 },
  { productId: "p2", title: "Bamboo Necklace", quantity: 1, unitPrice: 120 },
];

const mockSubtotal = 210;

function renderCheckoutForm(onOrderCreated?: (orderId: string) => void) {
  return render(
    <CheckoutForm
      items={mockItems}
      subtotal={mockSubtotal}
      onOrderCreated={onOrderCreated}
    />
  );
}

describe("CheckoutForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all 4 required form field labels", () => {
    renderCheckoutForm();

    expect(screen.getByText("Customer Name")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Phone")).toBeInTheDocument();
    expect(screen.getByText("Shipping Address")).toBeInTheDocument();
  });

  it("does NOT render a payment method section", () => {
    renderCheckoutForm();

    expect(screen.queryByText(/payment method/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/credit card/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/bank transfer/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/e-wallet/i)).not.toBeInTheDocument();
  });

  it("displays WhatsApp explanation text", () => {
    renderCheckoutForm();

    expect(
      screen.getByText(/your order details will be sent to our office via whatsapp/i)
    ).toBeInTheDocument();
  });

  it("has submit button disabled when form is empty", () => {
    renderCheckoutForm();

    const submitButton = screen.getByRole("button", {
      name: /confirm & send via whatsapp/i,
    });
    expect(submitButton).toBeDisabled();
  });

  it("enables submit button when all fields are valid", async () => {
    const user = userEvent.setup();
    renderCheckoutForm();

    await user.type(screen.getByPlaceholderText("Your full name"), "John Doe");
    await user.type(
      screen.getByPlaceholderText("you@example.com"),
      "john@example.com"
    );
    await user.type(
      screen.getByPlaceholderText("+62 812 3456 7890"),
      "+628123456789"
    );
    await user.type(
      screen.getByPlaceholderText(
        "Full shipping address including city and postal code"
      ),
      "123 Main Street, Ubud, Bali 80571"
    );

    const submitButton = screen.getByRole("button", {
      name: /confirm & send via whatsapp/i,
    });

    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });
  });

  it("successful submission creates order and opens WhatsApp link", async () => {
    const user = userEvent.setup();
    const onOrderCreated = vi.fn();

    const mockOrder = { id: "order-123", stage: "Order_Submitted", traceId: "trace-123" };
    vi.mocked(createOrder).mockReturnValue(mockOrder as any);
    vi.mocked(openWhatsAppCheckout).mockReturnValue({
      success: true,
      url: "https://wa.me/123?text=test",
      truncated: false,
    });

    renderCheckoutForm(onOrderCreated);

    // Fill form
    await user.type(screen.getByPlaceholderText("Your full name"), "John Doe");
    await user.type(
      screen.getByPlaceholderText("you@example.com"),
      "john@example.com"
    );
    await user.type(
      screen.getByPlaceholderText("+62 812 3456 7890"),
      "+628123456789"
    );
    await user.type(
      screen.getByPlaceholderText(
        "Full shipping address including city and postal code"
      ),
      "123 Main Street, Ubud, Bali 80571"
    );

    // Submit form
    const submitButton = screen.getByRole("button", {
      name: /confirm & send via whatsapp/i,
    });
    await waitFor(() => expect(submitButton).toBeEnabled());
    await user.click(submitButton);

    await waitFor(() => {
      expect(createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          customerName: "John Doe",
          customerEmail: "john@example.com",
          customerPhone: "+628123456789",
          shippingAddress: "123 Main Street, Ubud, Bali 80571",
          items: mockItems,
          subtotal: mockSubtotal,
        })
      );
    });

    expect(openWhatsAppCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: "order-123",
        customerName: "John Doe",
        customerPhone: "+628123456789",
        customerEmail: "john@example.com",
        shippingAddress: "123 Main Street, Ubud, Bali 80571",
        subtotal: mockSubtotal,
      })
    );

    expect(transitionStage).toHaveBeenCalledWith("order-123", "Quotation_Pending");
    expect(onOrderCreated).toHaveBeenCalledWith("order-123");

    // Verify Zenvix integration was triggered
    expect(syncOrderCreation).toHaveBeenCalledWith(mockOrder);
  });

  it("shows error toast when WhatsApp link fails", async () => {
    const user = userEvent.setup();

    const mockOrder = { id: "order-456", stage: "Order_Submitted", traceId: "trace-456" };
    vi.mocked(createOrder).mockReturnValue(mockOrder as any);
    vi.mocked(openWhatsAppCheckout).mockImplementation(() => {
      throw new Error("WhatsApp link failed");
    });

    renderCheckoutForm();

    // Fill form
    await user.type(screen.getByPlaceholderText("Your full name"), "Jane Smith");
    await user.type(
      screen.getByPlaceholderText("you@example.com"),
      "jane@example.com"
    );
    await user.type(
      screen.getByPlaceholderText("+62 812 3456 7890"),
      "+628199887766"
    );
    await user.type(
      screen.getByPlaceholderText(
        "Full shipping address including city and postal code"
      ),
      "456 Beach Road, Seminyak, Bali 80361"
    );

    // Submit form
    const submitButton = screen.getByRole("button", {
      name: /confirm & send via whatsapp/i,
    });
    await waitFor(() => expect(submitButton).toBeEnabled());
    await user.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Unable to open WhatsApp",
        expect.objectContaining({
          description: expect.stringContaining("contact us directly at"),
          duration: 8000,
        })
      );
    });

    // transitionStage should NOT be called when WhatsApp fails
    expect(transitionStage).not.toHaveBeenCalled();
  });
});
