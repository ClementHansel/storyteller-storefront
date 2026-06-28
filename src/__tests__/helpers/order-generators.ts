import * as fc from "fast-check";
import type {
  CheckoutFormData,
  OrderRecord,
  OrderStage,
  WhatsAppMessage,
} from "@/types/order";

// --- Checkout Form Data Generators ---

/**
 * Generates a valid customer name (non-empty after trim).
 */
const validName = fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0);

/**
 * Generates a valid email address.
 */
const validEmail = fc
  .tuple(
    fc.stringMatching(/^[a-z][a-z0-9._]{0,19}$/),
    fc.stringMatching(/^[a-z][a-z0-9]{0,9}$/),
    fc.constantFrom("com", "org", "net", "io", "co")
  )
  .map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

/**
 * Generates a valid phone number (≥5 chars after trim).
 */
const validPhone = fc.string({ minLength: 5, maxLength: 20 }).filter((s) => s.trim().length >= 5);

/**
 * Generates a valid shipping address (≥10 chars after trim).
 */
const validAddress = fc
  .string({ minLength: 10, maxLength: 200 })
  .filter((s) => s.trim().length >= 10);

/**
 * Generates valid CheckoutFormData where all fields meet validation requirements.
 */
export const validCheckoutFormData: fc.Arbitrary<CheckoutFormData> = fc.record({
  customerName: validName,
  customerEmail: validEmail,
  customerPhone: validPhone,
  shippingAddress: validAddress,
});

/**
 * Generates invalid CheckoutFormData with at least one invalid field.
 */
export const invalidCheckoutFormData: fc.Arbitrary<CheckoutFormData> = fc.oneof(
  // Empty name
  fc.record({
    customerName: fc.constant(""),
    customerEmail: validEmail,
    customerPhone: validPhone,
    shippingAddress: validAddress,
  }),
  // Whitespace-only name
  fc.record({
    customerName: fc.constant("   "),
    customerEmail: validEmail,
    customerPhone: validPhone,
    shippingAddress: validAddress,
  }),
  // Invalid email (no @)
  fc.record({
    customerName: validName,
    customerEmail: fc.stringMatching(/^[a-z]{3,10}$/).map((s) => s),
    customerPhone: validPhone,
    shippingAddress: validAddress,
  }),
  // Phone too short (< 5 chars after trim)
  fc.record({
    customerName: validName,
    customerEmail: validEmail,
    customerPhone: fc.constantFrom("", "1", "12", "123", "1234"),
    shippingAddress: validAddress,
  }),
  // Address too short (< 10 chars after trim)
  fc.record({
    customerName: validName,
    customerEmail: validEmail,
    customerPhone: validPhone,
    shippingAddress: fc.constantFrom("", "Short", "123456789"),
  })
);

// --- Order Item Generators ---

/**
 * Generates a single order item with title, quantity, and unitPrice.
 */
const orderItem = fc.record({
  title: fc.string({ minLength: 1, maxLength: 80 }).filter((s) => s.trim().length > 0),
  quantity: fc.integer({ min: 1, max: 100 }),
  unitPrice: fc.integer({ min: 1, max: 9999900 }).map((n) => n / 100),
});

/**
 * Generates a single order item with productId (for OrderRecord items).
 */
const orderRecordItem = fc.record({
  productId: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 80 }).filter((s) => s.trim().length > 0),
  quantity: fc.integer({ min: 1, max: 100 }),
  unitPrice: fc.integer({ min: 1, max: 9999900 }).map((n) => n / 100),
});

/**
 * Generates a non-empty array of order items (for WhatsAppMessage).
 */
export const validItemList: fc.Arbitrary<Array<{ title: string; quantity: number; unitPrice: number }>> =
  fc.array(orderItem, { minLength: 1, maxLength: 20 });

/**
 * Generates a non-empty array of order record items (with productId).
 */
export const validOrderRecordItemList: fc.Arbitrary<
  Array<{ productId: string; title: string; quantity: number; unitPrice: number }>
> = fc.array(orderRecordItem, { minLength: 1, maxLength: 20 });

// --- Order Record Generator ---

const orderStages: OrderStage[] = [
  "Order_Submitted",
  "Quotation_Pending",
  "Quotation_Sent",
  "Payment_Pending",
  "Payment_Confirmed",
  "Complete",
];

/**
 * Generates a valid OrderStage.
 */
export const validOrderStage: fc.Arbitrary<OrderStage> = fc.constantFrom(...orderStages);

/**
 * Generates a valid ISO timestamp string.
 */
const validTimestamp = fc
  .integer({
    min: new Date("2024-01-01").getTime(),
    max: new Date("2030-12-31").getTime(),
  })
  .map((ms) => new Date(ms).toISOString());

/**
 * Generates a valid OrderRecord with all required fields.
 */
export const validOrderRecord: fc.Arbitrary<OrderRecord> = fc
  .record({
    id: fc.uuid(),
    stage: validOrderStage,
    customerName: validName,
    customerEmail: validEmail,
    customerPhone: validPhone,
    shippingAddress: validAddress,
    items: validOrderRecordItemList,
    subtotal: fc.integer({ min: 1, max: 99999900 }).map((n) => n / 100),
    createdAt: validTimestamp,
    updatedAt: validTimestamp,
    stageHistory: fc
      .array(
        fc.record({
          stage: validOrderStage,
          timestamp: validTimestamp,
        }),
        { minLength: 1, maxLength: 6 }
      ),
  })
  .map((record) => ({
    ...record,
    stageHistory: [{ stage: record.stage, timestamp: record.createdAt }, ...record.stageHistory],
  }));

// --- Phone Number Generators ---

/**
 * Generates a valid phone number for WhatsApp (digits only, 10-15 chars).
 */
export const validWhatsAppPhone: fc.Arbitrary<string> = fc
  .integer({ min: 10, max: 15 })
  .chain((len) =>
    fc.stringMatching(new RegExp(`^[0-9]{${len}}$`))
  );

/**
 * Generates an invalid phone number (not digits only, or wrong length).
 */
export const invalidWhatsAppPhone: fc.Arbitrary<string> = fc.oneof(
  // Too short (< 10 digits)
  fc.stringMatching(/^[0-9]{1,9}$/),
  // Too long (> 15 digits)
  fc.stringMatching(/^[0-9]{16,20}$/),
  // Contains non-digit characters
  fc
    .tuple(
      fc.stringMatching(/^[0-9]{4,7}$/),
      fc.constantFrom("+", "-", " ", "(", ")", "a", "x")
    )
    .map(([digits, char]) => digits + char + digits),
  // Empty string
  fc.constant("")
);

// --- WhatsApp Message Generator ---

/**
 * Generates valid WhatsAppMessage data for testing message composition.
 */
export const validWhatsAppMessage: fc.Arbitrary<WhatsAppMessage> = fc.record({
  orderId: fc.uuid(),
  customerName: validName,
  customerPhone: validPhone,
  customerEmail: validEmail,
  shippingAddress: validAddress,
  items: validItemList,
  subtotal: fc.integer({ min: 1, max: 99999900 }).map((n) => n / 100),
});

/**
 * Generates a WhatsAppMessage with many items that will produce a message exceeding 1000 characters.
 * Used for testing truncation logic.
 */
export const longWhatsAppMessage: fc.Arbitrary<WhatsAppMessage> = fc.record({
  orderId: fc.uuid(),
  customerName: fc.string({ minLength: 20, maxLength: 50 }).filter((s) => s.trim().length >= 20),
  customerPhone: fc.string({ minLength: 10, maxLength: 15 }).filter((s) => s.trim().length >= 10),
  customerEmail: validEmail,
  shippingAddress: fc.string({ minLength: 50, maxLength: 100 }).filter((s) => s.trim().length >= 50),
  items: fc.array(
    fc.record({
      title: fc.string({ minLength: 20, maxLength: 60 }).filter((s) => s.trim().length >= 20),
      quantity: fc.integer({ min: 1, max: 100 }),
      unitPrice: fc.integer({ min: 1, max: 9999900 }).map((n) => n / 100),
    }),
    { minLength: 15, maxLength: 30 }
  ),
  subtotal: fc.integer({ min: 10000, max: 99999900 }).map((n) => n / 100),
});
