import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { calculateBackoffDelay } from "@/api/zenvix-order-sync";

/**
 * Feature: vps-deployment-zenvix-integration, Property 3: Exponential backoff produces correct delay
 * **Validates: Requirements 4.3, 6.4, 7.4**
 */

describe("Property 3: Exponential backoff produces correct delay", () => {
  it("returns baseDelay × 2^retries for retry attempts 0-4 with default baseDelay", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 4 }),
        (retries) => {
          const delay = calculateBackoffDelay(retries);
          const expected = 2000 * Math.pow(2, retries);
          expect(delay).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns baseDelay × 2^retries for arbitrary positive baseDelay values", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 4 }),
        fc.integer({ min: 100, max: 60000 }),
        (retries, baseDelay) => {
          const delay = calculateBackoffDelay(retries, baseDelay);
          const expected = baseDelay * Math.pow(2, retries);
          expect(delay).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("produces monotonically increasing delays for successive retry attempts", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 3 }),
        fc.integer({ min: 100, max: 60000 }),
        (retries, baseDelay) => {
          const currentDelay = calculateBackoffDelay(retries, baseDelay);
          const nextDelay = calculateBackoffDelay(retries + 1, baseDelay);
          expect(nextDelay).toBe(currentDelay * 2);
        }
      ),
      { numRuns: 100 }
    );
  });
});
