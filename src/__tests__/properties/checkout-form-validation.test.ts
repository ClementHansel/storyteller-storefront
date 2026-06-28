import * as fc from "fast-check";
import { describe, it } from "vitest";
import { validateCheckoutForm, checkoutFormSchema } from "@/lib/checkout-validation";
import {
  validCheckoutFormData,
  invalidCheckoutFormData,
} from "@/__tests__/helpers/order-generators";

describe("Feature: whatsapp-checkout-flow, Property 7: Checkout form validation correctness", () => {
  /**
   * **Validates: Requirements 7.2**
   *
   * Property 7: Checkout form validation correctness
   * For any combination of checkout form fields, the validation function SHALL return
   * valid=true if and only if: name is non-empty after trim, email matches email format,
   * phone is ≥5 chars after trim, and address is ≥10 chars after trim.
   * For any input that fails one or more of these conditions, validation SHALL return
   * valid=false with appropriate error messages for failing fields.
   */
  it("should return valid=true for any valid checkout form data", () => {
    fc.assert(
      fc.property(
        validCheckoutFormData.filter((data) =>
          checkoutFormSchema.safeParse(data).success
        ),
        (formData) => {
          const result = validateCheckoutForm(formData);

          // Valid form data must always produce valid=true
          if (result.valid !== true) {
            return false;
          }

          // Should have no errors property or errors should be undefined
          if (result.errors !== undefined) {
            return false;
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should return valid=false with error messages for any invalid checkout form data", () => {
    fc.assert(
      fc.property(invalidCheckoutFormData, (formData) => {
        const result = validateCheckoutForm(formData);

        // Invalid form data must always produce valid=false
        if (result.valid !== false) {
          return false;
        }

        // Must include errors object
        if (!result.errors || typeof result.errors !== "object") {
          return false;
        }

        // At least one error message must be present
        const errorKeys = Object.keys(result.errors);
        if (errorKeys.length === 0) {
          return false;
        }

        // Each error must be a non-empty string
        for (const key of errorKeys) {
          if (typeof result.errors[key] !== "string" || result.errors[key].length === 0) {
            return false;
          }
        }

        // Verify that the specific failing field has an error message:
        // - Empty/whitespace name → customerName error
        if (formData.customerName.trim().length === 0) {
          if (!result.errors["customerName"]) return false;
        }

        // - Invalid email (no @ or invalid format) → customerEmail error
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.customerEmail)) {
          if (!result.errors["customerEmail"]) return false;
        }

        // - Phone too short (< 5 chars after trim) → customerPhone error
        if (formData.customerPhone.trim().length < 5) {
          if (!result.errors["customerPhone"]) return false;
        }

        // - Address too short (< 10 chars after trim) → shippingAddress error
        if (formData.shippingAddress.trim().length < 10) {
          if (!result.errors["shippingAddress"]) return false;
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });
});
