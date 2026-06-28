import { describe, it, expect } from "vitest";
import { composeWhatsAppMessage } from "./whatsapp-connector";
import type { WhatsAppMessage } from "@/types/order";

describe("composeWhatsAppMessage", () => {
  const baseData: WhatsAppMessage = {
    orderId: "abc-123",
    customerName: "Maria Garcia",
    customerPhone: "+6281234567890",
    customerEmail: "maria@example.com",
    shippingAddress: "Jl. Raya Ubud No. 10, Gianyar, Bali 80571",
    items: [
      { title: "Silver Ring - Bamboo", quantity: 2, unitPrice: 45.0 },
      { title: "Pearl Necklace", quantity: 1, unitPrice: 120.5 },
    ],
    subtotal: 210.5,
  };

  it("includes the order reference ID with hash prefix", () => {
    const message = composeWhatsAppMessage(baseData);
    expect(message).toContain("#abc-123");
  });

  it("includes the section header for the order", () => {
    const message = composeWhatsAppMessage(baseData);
    expect(message).toContain("🛒 *New Order — #abc-123*");
  });

  it("includes customer section with all fields", () => {
    const message = composeWhatsAppMessage(baseData);
    expect(message).toContain("👤 *Customer*");
    expect(message).toContain("Name: Maria Garcia");
    expect(message).toContain("Phone: +6281234567890");
    expect(message).toContain("Email: maria@example.com");
  });

  it("includes shipping address section", () => {
    const message = composeWhatsAppMessage(baseData);
    expect(message).toContain("📍 *Shipping Address*");
    expect(message).toContain("Jl. Raya Ubud No. 10, Gianyar, Bali 80571");
  });

  it("includes items section with each item's details", () => {
    const message = composeWhatsAppMessage(baseData);
    expect(message).toContain("📦 *Items*");
    expect(message).toContain("• Silver Ring - Bamboo × 2 — $45.00");
    expect(message).toContain("• Pearl Necklace × 1 — $120.50");
  });

  it("includes subtotal", () => {
    const message = composeWhatsAppMessage(baseData);
    expect(message).toContain("💰 *Subtotal: $210.50*");
  });

  it("includes the quotation request footer", () => {
    const message = composeWhatsAppMessage(baseData);
    expect(message).toContain("📋 Please provide a quotation including delivery costs.");
  });

  it("returns non-truncated message when encoded length is within 1000 chars", () => {
    const message = composeWhatsAppMessage(baseData);
    expect(encodeURIComponent(message).length).toBeLessThanOrEqual(1000);
    // Should contain full item details
    expect(message).toContain("• Silver Ring - Bamboo × 2 — $45.00");
  });

  describe("truncation", () => {
    const longData: WhatsAppMessage = {
      orderId: "order-xyz-789",
      customerName: "A Very Long Customer Name For Testing",
      customerPhone: "+6281234567890123",
      customerEmail: "verylongemailaddress@longdomainname.com",
      shippingAddress:
        "A very long shipping address that goes on and on, Street 123, Building A, Floor 5, Apartment 10, District Name, City, Province, Country 12345",
      items: Array.from({ length: 20 }, (_, i) => ({
        title: `Handcrafted Silver Jewelry Item Number ${i + 1} With Long Description`,
        quantity: i + 1,
        unitPrice: 50 + i * 10,
      })),
      subtotal: 4950.0,
    };

    it("truncates item details when encoded message exceeds 1000 chars", () => {
      const message = composeWhatsAppMessage(longData);
      expect(message).toContain(`(${longData.items.length} items — see order #${longData.orderId})`);
      // Should NOT contain individual item lines
      expect(message).not.toContain("• Handcrafted Silver Jewelry");
    });

    it("preserves order reference ID after truncation", () => {
      const message = composeWhatsAppMessage(longData);
      expect(message).toContain("#order-xyz-789");
    });

    it("preserves subtotal after truncation", () => {
      const message = composeWhatsAppMessage(longData);
      expect(message).toContain("$4950.00");
    });

    it("keeps customer info and shipping address in truncated message", () => {
      const message = composeWhatsAppMessage(longData);
      expect(message).toContain("A Very Long Customer Name For Testing");
      expect(message).toContain(longData.shippingAddress);
    });
  });
});
