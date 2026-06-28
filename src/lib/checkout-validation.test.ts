import { describe, it, expect } from "vitest";
import { checkoutFormSchema, validateCheckoutForm } from "./checkout-validation";

describe("checkoutFormSchema", () => {
  const validData = {
    customerName: "Maria Garcia",
    customerEmail: "maria@example.com",
    customerPhone: "62812345",
    shippingAddress: "Jl. Raya Ubud No. 10, Bali",
  };

  it("accepts valid checkout data", () => {
    const result = checkoutFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects empty customer name", () => {
    const result = checkoutFormSchema.safeParse({ ...validData, customerName: "" });
    expect(result.success).toBe(false);
  });

  it("rejects whitespace-only customer name", () => {
    const result = checkoutFormSchema.safeParse({ ...validData, customerName: "   " });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email format", () => {
    const result = checkoutFormSchema.safeParse({ ...validData, customerEmail: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects phone shorter than 5 characters", () => {
    const result = checkoutFormSchema.safeParse({ ...validData, customerPhone: "1234" });
    expect(result.success).toBe(false);
  });

  it("accepts phone with exactly 5 characters", () => {
    const result = checkoutFormSchema.safeParse({ ...validData, customerPhone: "12345" });
    expect(result.success).toBe(true);
  });

  it("rejects address shorter than 10 characters", () => {
    const result = checkoutFormSchema.safeParse({ ...validData, shippingAddress: "Short" });
    expect(result.success).toBe(false);
  });

  it("accepts address with exactly 10 characters", () => {
    const result = checkoutFormSchema.safeParse({ ...validData, shippingAddress: "1234567890" });
    expect(result.success).toBe(true);
  });
});

describe("validateCheckoutForm", () => {
  it("returns valid true for correct data", () => {
    const result = validateCheckoutForm({
      customerName: "John",
      customerEmail: "john@test.com",
      customerPhone: "08123",
      shippingAddress: "123 Main Street",
    });
    expect(result).toEqual({ valid: true });
  });

  it("returns field-level errors for invalid data", () => {
    const result = validateCheckoutForm({
      customerName: "",
      customerEmail: "bad",
      customerPhone: "12",
      shippingAddress: "short",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors!.customerName).toBeDefined();
    expect(result.errors!.customerEmail).toBeDefined();
    expect(result.errors!.customerPhone).toBeDefined();
    expect(result.errors!.shippingAddress).toBeDefined();
  });

  it("only reports errors for failing fields", () => {
    const result = validateCheckoutForm({
      customerName: "Valid Name",
      customerEmail: "invalid",
      customerPhone: "08123456789",
      shippingAddress: "Valid shipping address here",
    });
    expect(result.valid).toBe(false);
    expect(result.errors!.customerEmail).toBeDefined();
    expect(result.errors!.customerName).toBeUndefined();
    expect(result.errors!.customerPhone).toBeUndefined();
    expect(result.errors!.shippingAddress).toBeUndefined();
  });
});
