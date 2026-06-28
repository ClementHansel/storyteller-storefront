import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { isZenvixConfigured } from "@/config/runtime-env";

/**
 * Feature: vps-deployment-zenvix-integration, Property 22: Configuration fallback on missing required variables
 * **Validates: Requirements 3.4**
 */

const REQUIRED_VARS = [
  "VITE_ZENVIX_API_URL",
  "VITE_ZENVIX_TENANT_ID",
  "VITE_ZENVIX_CLIENT_ID",
  "VITE_ZENVIX_CLIENT_SECRET",
] as const;

describe("Property 22: Configuration fallback on missing required variables", () => {
  let originalEnv: Record<string, string | undefined> | undefined;
  let savedImportMetaEnv: Record<string, string | undefined>;

  beforeEach(() => {
    originalEnv = window.__ENV__;
    // Save and clear import.meta.env for the required vars so the fallback path
    // doesn't mask missing window.__ENV__ entries
    savedImportMetaEnv = {};
    for (const key of REQUIRED_VARS) {
      savedImportMetaEnv[key] = (import.meta.env as Record<string, string | undefined>)[key];
      delete (import.meta.env as Record<string, string | undefined>)[key];
    }
    // Suppress console.warn from isZenvixConfigured
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    window.__ENV__ = originalEnv;
    // Restore import.meta.env
    for (const key of REQUIRED_VARS) {
      if (savedImportMetaEnv[key] !== undefined) {
        (import.meta.env as Record<string, string | undefined>)[key] = savedImportMetaEnv[key];
      }
    }
    vi.restoreAllMocks();
  });

  it("returns false when any subset of the 4 required vars is missing", () => {
    fc.assert(
      fc.property(
        // Generate a proper subset of REQUIRED_VARS to include (0 to 3 vars — never all 4)
        fc.subarray([...REQUIRED_VARS], { minLength: 0, maxLength: 3 }),
        // Generate non-empty values for the included vars
        fc.array(fc.string({ minLength: 1 }), { minLength: 4, maxLength: 4 }),
        (includedVars, values) => {
          // Build window.__ENV__ with only the included vars set
          const env: Record<string, string> = {};
          includedVars.forEach((varName, index) => {
            env[varName] = values[index];
          });

          window.__ENV__ = env;
          expect(isZenvixConfigured()).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns false when any required var is set to an empty string", () => {
    fc.assert(
      fc.property(
        // Pick which var(s) to make empty (at least one must be empty)
        fc.subarray([...REQUIRED_VARS], { minLength: 1, maxLength: 4 }),
        // Generate non-empty values for the rest
        fc.array(fc.string({ minLength: 1 }), { minLength: 4, maxLength: 4 }),
        (emptyVars, values) => {
          const env: Record<string, string> = {};
          let valueIndex = 0;

          for (const varName of REQUIRED_VARS) {
            if (emptyVars.includes(varName)) {
              env[varName] = "";
            } else {
              env[varName] = values[valueIndex++] || "fallback-value";
            }
          }

          window.__ENV__ = env;
          expect(isZenvixConfigured()).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns true when ALL 4 required vars are present and non-empty", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        (apiUrl, tenantId, clientId, clientSecret) => {
          window.__ENV__ = {
            VITE_ZENVIX_API_URL: apiUrl,
            VITE_ZENVIX_TENANT_ID: tenantId,
            VITE_ZENVIX_CLIENT_ID: clientId,
            VITE_ZENVIX_CLIENT_SECRET: clientSecret,
          };

          expect(isZenvixConfigured()).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
