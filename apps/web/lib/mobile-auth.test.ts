import { describe, expect, test, beforeEach } from "vitest";
import {
  createMobileAccessToken,
  requireMobileUserId,
  verifyMobileAccessToken
} from "./mobile-auth";

describe("mobile bearer token auth", () => {
  beforeEach(() => {
    process.env.MOBILE_AUTH_SECRET = "test-mobile-secret-that-is-long-enough-12345";
  });

  test("tokenなしで401相当のnullを返す", () => {
    const request = new Request("http://localhost/api/mobile/me");

    expect(requireMobileUserId(request)).toBeNull();
  });

  test("不正tokenで401相当のnullを返す", () => {
    const request = new Request("http://localhost/api/mobile/me", {
      headers: { Authorization: "Bearer invalid-token" }
    });

    expect(requireMobileUserId(request)).toBeNull();
    expect(verifyMobileAccessToken("invalid-token")).toBeNull();
  });

  test("正常tokenでuserIdを取得する", () => {
    const token = createMobileAccessToken("user-1");
    const request = new Request("http://localhost/api/mobile/me", {
      headers: { Authorization: `Bearer ${token}` }
    });

    expect(requireMobileUserId(request)).toBe("user-1");
    expect(verifyMobileAccessToken(token)?.userId).toBe("user-1");
  });
});
