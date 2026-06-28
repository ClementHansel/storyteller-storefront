import { z } from "zod";
import type { CheckoutFormData } from "@/types/order";

/**
 * Zod validation schema for the WhatsApp checkout form.
 * Validates customer details before order submission.
 */
export const checkoutFormSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(1, "Name is required"),
  customerEmail: z
    .string()
    .email("Please enter a valid email address"),
  customerPhone: z
    .string()
    .trim()
    .min(5, "Phone number must be at least 5 characters"),
  shippingAddress: z
    .string()
    .trim()
    .min(10, "Shipping address must be at least 10 characters"),
});

export type CheckoutFormValidationResult = {
  valid: boolean;
  errors?: Record<string, string>;
};

/**
 * Validates checkout form data and returns a structured result
 * with field-level error messages.
 */
export function validateCheckoutForm(
  data: CheckoutFormData
): CheckoutFormValidationResult {
  const result = checkoutFormSchema.safeParse(data);

  if (result.success) {
    return { valid: true };
  }

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as string;
    // Only keep the first error per field
    if (!errors[field]) {
      errors[field] = issue.message;
    }
  }

  return { valid: false, errors };
}
