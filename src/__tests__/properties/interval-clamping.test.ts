import { describe, it, expect, beforeEach } from "vitest";
import * as fc from "fast-check";
import { clampInterval, resetPollerState } from "@/api/zenvix-notification-poller";

/**
 * Feature: vps-deployment-zenvix-integration, Property 11: Notification poller interval clamping
 * **Validates: Requirements 7.1**
 */

const MIN_INTERVAL = 10000;
const MAX_INTERVAL = 300000;

describe("Property 11: Notification poller interval clamping", () => {
  beforeEach(() => {
    resetPollerState();
  });

  it("always returns a value within [10000, 300000] for arbitrary numbers", () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1e9, max: 1e9, noNaN: true }),
        (interval) => {
          const result = clampInterval(interval);
          expect(result).toBeGreaterThanOrEqual(MIN_INTERVAL);
          expect(result).toBeLessThanOrEqual(MAX_INTERVAL);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns the input unchanged when within [10000, 300000]", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: MIN_INTERVAL, max: MAX_INTERVAL }),
        (interval) => {
          const result = clampInterval(interval);
          expect(result).toBe(interval);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns 10000 when input is below 10000", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1000000, max: MIN_INTERVAL - 1 }),
        (interval) => {
          const result = clampInterval(interval);
          expect(result).toBe(MIN_INTERVAL);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns 300000 when input is above 300000", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: MAX_INTERVAL + 1, max: 10000000 }),
        (interval) => {
          const result = clampInterval(interval);
          expect(result).toBe(MAX_INTERVAL);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("clamps negative and zero values to the minimum", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -10000000, max: 0 }),
        (interval) => {
          const result = clampInterval(interval);
          expect(result).toBe(MIN_INTERVAL);
        }
      ),
      { numRuns: 100 }
    );
  });
});
