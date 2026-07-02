import { describe, expect, it } from "vitest";
import { getAdminEmailSet, isAdminEmail } from "@/lib/admin-emails";

describe("admin email helpers", () => {
  it("normalizes comma-separated ADMIN_EMAILS values", () => {
    expect([...getAdminEmailSet(" Example@example.com, admin@example.com , ")]).toEqual([
      "example@example.com",
      "admin@example.com"
    ]);
  });

  it("matches emails case-insensitively", () => {
    expect(isAdminEmail("EXAMPLE@example.com", "example@example.com")).toBe(true);
    expect(isAdminEmail("user@example.com", "example@example.com")).toBe(false);
  });

  it("does not grant admin access when ADMIN_EMAILS is unset", () => {
    expect(isAdminEmail("example@example.com", "")).toBe(false);
    expect(isAdminEmail("example@example.com", undefined)).toBe(false);
  });
});
