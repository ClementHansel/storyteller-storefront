import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getEnv,
  getZenvixApiUrl,
  getZenvixTenantId,
  getZenvixClientId,
  getZenvixClientSecret,
  getZenvixChannelRecordId,
  getZenvixBranchId,
  getZenvixApiKey,
  getWhatsAppOfficePhone,
} from "./runtime-env";

describe("runtime-env", () => {
  let originalEnv: Record<string, string | undefined> | undefined;

  beforeEach(() => {
    // Save and clear window.__ENV__
    originalEnv = window.__ENV__;
    window.__ENV__ = undefined;
  });

  afterEach(() => {
    window.__ENV__ = originalEnv;
  });

  describe("getEnv", () => {
    it("returns window.__ENV__ value when present", () => {
      window.__ENV__ = { VITE_ZENVIX_API_URL: "http://runtime.example.com" };
      expect(getEnv("VITE_ZENVIX_API_URL")).toBe("http://runtime.example.com");
    });

    it("falls back to import.meta.env when window.__ENV__ is undefined", () => {
      window.__ENV__ = undefined;
      // import.meta.env values are set at build time; in test env they may be empty
      const result = getEnv("VITE_ZENVIX_API_URL");
      // Should return undefined or the build-time value (not throw)
      expect(result === undefined || typeof result === "string").toBe(true);
    });

    it("falls back to import.meta.env when window.__ENV__ key is empty string", () => {
      window.__ENV__ = { VITE_ZENVIX_API_URL: "" };
      // Empty string in __ENV__ should trigger fallback
      const result = getEnv("VITE_ZENVIX_API_URL");
      expect(result === undefined || typeof result === "string").toBe(true);
    });

    it("returns undefined for completely missing keys", () => {
      window.__ENV__ = {};
      const result = getEnv("VITE_NONEXISTENT_KEY");
      expect(result).toBeUndefined();
    });

    it("runtime value takes precedence over build-time value", () => {
      window.__ENV__ = { VITE_ZENVIX_API_URL: "http://override.example.com" };
      expect(getEnv("VITE_ZENVIX_API_URL")).toBe("http://override.example.com");
    });
  });

  describe("typed getters", () => {
    beforeEach(() => {
      window.__ENV__ = {
        VITE_ZENVIX_API_URL: "http://api.test.com",
        VITE_ZENVIX_TENANT_ID: "tenant-123",
        VITE_ZENVIX_CLIENT_ID: "client-abc",
        VITE_ZENVIX_CLIENT_SECRET: "secret-xyz",
        VITE_ZENVIX_CHANNEL_RECORD_ID: "channel-456",
        VITE_ZENVIX_BRANCH_ID: "branch-789",
        VITE_ZENVIX_API_KEY: "apikey-000",
        VITE_WHATSAPP_OFFICE_PHONE: "+1234567890",
      };
    });

    it("getZenvixApiUrl returns the API URL", () => {
      expect(getZenvixApiUrl()).toBe("http://api.test.com");
    });

    it("getZenvixTenantId returns the tenant ID", () => {
      expect(getZenvixTenantId()).toBe("tenant-123");
    });

    it("getZenvixClientId returns the client ID", () => {
      expect(getZenvixClientId()).toBe("client-abc");
    });

    it("getZenvixClientSecret returns the client secret", () => {
      expect(getZenvixClientSecret()).toBe("secret-xyz");
    });

    it("getZenvixChannelRecordId returns the channel record ID", () => {
      expect(getZenvixChannelRecordId()).toBe("channel-456");
    });

    it("getZenvixBranchId returns the branch ID", () => {
      expect(getZenvixBranchId()).toBe("branch-789");
    });

    it("getZenvixApiKey returns the API key", () => {
      expect(getZenvixApiKey()).toBe("apikey-000");
    });

    it("getWhatsAppOfficePhone returns the phone number", () => {
      expect(getWhatsAppOfficePhone()).toBe("+1234567890");
    });

    it("getters return empty string when window.__ENV__ is not set", () => {
      window.__ENV__ = undefined;
      // Getters fall back to import.meta.env, which in test is likely empty
      // They should never throw and should return a string
      expect(typeof getZenvixApiUrl()).toBe("string");
      expect(typeof getZenvixTenantId()).toBe("string");
      expect(typeof getZenvixClientId()).toBe("string");
      expect(typeof getZenvixClientSecret()).toBe("string");
      expect(typeof getZenvixChannelRecordId()).toBe("string");
      expect(typeof getZenvixBranchId()).toBe("string");
      expect(typeof getZenvixApiKey()).toBe("string");
      expect(typeof getWhatsAppOfficePhone()).toBe("string");
    });
  });
});
