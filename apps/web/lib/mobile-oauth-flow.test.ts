import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  mobileOAuthFlow: {
    create: vi.fn(),
    deleteMany: vi.fn(),
    findUnique: vi.fn(),
    updateMany: vi.fn()
  },
  user: {
    findUnique: vi.fn()
  }
}));

const mockAuth = vi.hoisted(() => ({
  auth: vi.fn()
}));

vi.mock("@table-tennis/db", () => ({
  prisma: mockPrisma
}));

vi.mock("@/auth", () => ({
  auth: mockAuth.auth
}));

import { POST as exchangeGoogleCode } from "@/app/api/mobile/auth/google/exchange/route";
import { POST as startGoogleFlow } from "@/app/api/mobile/auth/google/start/route";
import { GET as completeGoogleFlow } from "@/app/mobile-auth/google/complete/route";
import {
  clearMobileOAuthRateLimitForTest,
  createCodeChallenge,
  hashMobileOAuthValue,
  mobileOAuthCodeTtlMs
} from "@/lib/mobile-oauth-flow";

const state = "state_abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNO";
const codeVerifier = "verifier_abcdefghijklmnopqrstuvwxyzABCDEFGHIJK";
const code = "code_abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ";
const flowId = "flow_12345";
const now = new Date("2026-07-18T00:00:00.000Z");

afterEach(() => {
  vi.useRealTimers();
});

function postJson(path: string, body: unknown, origin = "https://table-tennis-app-rho.vercel.app") {
  return new Request(`${origin}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "203.0.113.10"
    },
    body: JSON.stringify(body)
  });
}

function getRequest(path: string) {
  return new Request(`https://table-tennis-app-rho.vercel.app${path}`, {
    headers: {
      "x-forwarded-for": "203.0.113.10"
    }
  });
}

function validFlow(overrides: Record<string, unknown> = {}) {
  return {
    id: flowId,
    stateHash: hashMobileOAuthValue(state),
    legalConsent: false,
    expiresAt: new Date(now.getTime() + 10 * 60 * 1000),
    completedAt: null,
    usedAt: null,
    createdAt: now,
    ...overrides
  };
}

describe("mobile google start API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(now);
    clearMobileOAuthRateLimitForTest();
    process.env.AUTH_URL = "https://table-tennis-app-rho.vercel.app";
    process.env.MOBILE_AUTH_SECRET = "test-mobile-secret-that-is-long-enough-12345";
    mockPrisma.mobileOAuthFlow.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.mobileOAuthFlow.create.mockResolvedValue({ id: flowId });
  });

  test("正しいstateとcodeChallengeでflowを作成できる", async () => {
    const codeChallenge = createCodeChallenge(codeVerifier);
    const response = await startGoogleFlow(postJson("/api/mobile/auth/google/start", {
      state,
      codeChallenge,
      legalConsent: true
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.authorizationUrl).toBe(
      `https://table-tennis-app-rho.vercel.app/mobile-auth/google?flow=${flowId}&state=${state}`
    );
    expect(mockPrisma.mobileOAuthFlow.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        stateHash: hashMobileOAuthValue(state),
        codeChallenge,
        legalConsent: true,
        expiresAt: new Date(now.getTime() + 10 * 60 * 1000)
      })
    }));
    expect(mockPrisma.mobileOAuthFlow.create.mock.calls[0]?.[0].data.stateHash).not.toBe(state);
  });

  test("不正なstateを拒否する", async () => {
    const response = await startGoogleFlow(postJson("/api/mobile/auth/google/start", {
      state: "short",
      codeChallenge: createCodeChallenge(codeVerifier)
    }));

    expect(response.status).toBe(400);
    expect(mockPrisma.mobileOAuthFlow.create).not.toHaveBeenCalled();
  });

  test("不正なcodeChallengeを拒否する", async () => {
    const response = await startGoogleFlow(postJson("/api/mobile/auth/google/start", {
      state,
      codeChallenge: "not-valid"
    }));

    expect(response.status).toBe(400);
    expect(mockPrisma.mobileOAuthFlow.create).not.toHaveBeenCalled();
  });

  test("任意redirectUriを指定できない", async () => {
    const response = await startGoogleFlow(postJson("/api/mobile/auth/google/start", {
      state,
      codeChallenge: createCodeChallenge(codeVerifier),
      redirectUri: "https://evil.example/callback"
    }));

    expect(response.status).toBe(400);
    expect(mockPrisma.mobileOAuthFlow.create).not.toHaveBeenCalled();
  });

  test("authorizationUrlが自分のWebドメインを向き秘密情報を含めない", async () => {
    const response = await startGoogleFlow(postJson(
      "/api/mobile/auth/google/start",
      {
        state,
        codeChallenge: createCodeChallenge(codeVerifier)
      },
      "https://evil.example"
    ));
    const body = await response.json();
    const authorizationUrl = new URL(body.authorizationUrl);

    expect(authorizationUrl.origin).toBe("https://table-tennis-app-rho.vercel.app");
    expect(body.authorizationUrl).not.toContain(codeVerifier);
    expect(JSON.stringify(body)).not.toContain("accessToken");
    expect(JSON.stringify(body)).not.toContain("GOOGLE_CLIENT_SECRET");
  });
});

describe("mobile google browser complete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(now);
    process.env.MOBILE_AUTH_SECRET = "test-mobile-secret-that-is-long-enough-12345";
  });

  test("未認証Auth.jsセッションではcodeを発行しない", async () => {
    mockPrisma.mobileOAuthFlow.findUnique.mockResolvedValue(validFlow());
    mockAuth.auth.mockResolvedValue(null);

    const response = await completeGoogleFlow(getRequest(`/mobile-auth/google/complete?flow=${flowId}&state=${state}`));

    expect(response.headers.get("location")).toBe(`tabletennis://auth/callback?error=oauth_failed&state=${state}`);
    expect(mockPrisma.mobileOAuthFlow.updateMany).not.toHaveBeenCalled();
  });

  test("存在しないflowを拒否する", async () => {
    mockPrisma.mobileOAuthFlow.findUnique.mockResolvedValue(null);
    mockAuth.auth.mockResolvedValue({
      user: { id: "user-1", googleReauthenticatedAt: Math.floor(now.getTime() / 1000) }
    });

    const response = await completeGoogleFlow(getRequest(`/mobile-auth/google/complete?flow=missing123&state=${state}`));

    expect(response.headers.get("location")).toBe(`tabletennis://auth/callback?error=expired&state=${state}`);
    expect(mockPrisma.mobileOAuthFlow.updateMany).not.toHaveBeenCalled();
  });

  test("期限切れflowを拒否する", async () => {
    mockPrisma.mobileOAuthFlow.findUnique.mockResolvedValue(validFlow({
      expiresAt: new Date(now.getTime() - 1)
    }));
    mockAuth.auth.mockResolvedValue({
      user: { id: "user-1", googleReauthenticatedAt: Math.floor(now.getTime() / 1000) }
    });

    const response = await completeGoogleFlow(getRequest(`/mobile-auth/google/complete?flow=${flowId}&state=${state}`));

    expect(response.headers.get("location")).toBe(`tabletennis://auth/callback?error=expired&state=${state}`);
    expect(mockPrisma.mobileOAuthFlow.updateMany).not.toHaveBeenCalled();
  });

  test("state不一致を拒否する", async () => {
    mockPrisma.mobileOAuthFlow.findUnique.mockResolvedValue(validFlow({
      stateHash: hashMobileOAuthValue("different_state_abcdefghijklmnopqrstuvwxyzAB")
    }));
    mockAuth.auth.mockResolvedValue({
      user: { id: "user-1", googleReauthenticatedAt: Math.floor(now.getTime() / 1000) }
    });

    const response = await completeGoogleFlow(getRequest(`/mobile-auth/google/complete?flow=${flowId}&state=${state}`));

    expect(response.headers.get("location")).toBe(`tabletennis://auth/callback?error=expired&state=${state}`);
    expect(mockPrisma.mobileOAuthFlow.updateMany).not.toHaveBeenCalled();
  });

  test("有効なUserでcodeを発行し固定callbackへ戻す", async () => {
    mockPrisma.mobileOAuthFlow.findUnique.mockResolvedValue(validFlow());
    mockPrisma.user.findUnique.mockResolvedValue({ id: "user-1" });
    mockPrisma.mobileOAuthFlow.updateMany.mockResolvedValue({ count: 1 });
    mockAuth.auth.mockResolvedValue({
      user: { id: "user-1", googleReauthenticatedAt: Math.floor(now.getTime() / 1000) }
    });

    const response = await completeGoogleFlow(getRequest(
      `/mobile-auth/google/complete?flow=${flowId}&state=${state}&redirectUri=https://evil.example`
    ));
    const location = response.headers.get("location");
    const callback = new URL(location ?? "");
    const issuedCode = callback.searchParams.get("code");

    expect(callback.protocol).toBe("tabletennis:");
    expect(callback.hostname).toBe("auth");
    expect(callback.pathname).toBe("/callback");
    expect(callback.searchParams.get("state")).toBe(state);
    expect(issuedCode).toEqual(expect.any(String));
    expect(location).not.toContain("accessToken");
    expect(location).not.toContain("Bearer");
    expect(location).not.toContain("google@example.com");
    expect(mockPrisma.mobileOAuthFlow.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: flowId,
        stateHash: hashMobileOAuthValue(state),
        completedAt: null,
        usedAt: null
      }),
      data: expect.objectContaining({
        codeHash: hashMobileOAuthValue(issuedCode ?? ""),
        userId: "user-1",
        completedAt: now,
        expiresAt: new Date(now.getTime() + mobileOAuthCodeTtlMs)
      })
    }));
    expect(mockPrisma.mobileOAuthFlow.updateMany.mock.calls[0]?.[0].data.codeHash).not.toBe(issuedCode);
  });
});

describe("mobile google exchange API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(now);
    clearMobileOAuthRateLimitForTest();
    process.env.MOBILE_AUTH_SECRET = "test-mobile-secret-that-is-long-enough-12345";
  });

  test("正しいcode、state、codeVerifierでtokenを取得できる", async () => {
    mockPrisma.mobileOAuthFlow.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.mobileOAuthFlow.findUnique.mockResolvedValue({
      user: { id: "user-1", name: "卓球 太郎", email: "user@example.com" }
    });

    const response = await exchangeGoogleCode(postJson("/api/mobile/auth/google/exchange", {
      code,
      state,
      codeVerifier
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.accessToken).toEqual(expect.any(String));
    expect(body.user).toEqual({ id: "user-1", name: "卓球 太郎", email: "user@example.com" });
    expect(mockPrisma.mobileOAuthFlow.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        codeHash: hashMobileOAuthValue(code),
        stateHash: hashMobileOAuthValue(state),
        codeChallenge: createCodeChallenge(codeVerifier),
        usedAt: null,
        userId: { not: null }
      }),
      data: { usedAt: now }
    }));
  });

  test("code不一致を拒否する", async () => {
    mockPrisma.mobileOAuthFlow.updateMany.mockResolvedValue({ count: 0 });

    const response = await exchangeGoogleCode(postJson("/api/mobile/auth/google/exchange", {
      code,
      state,
      codeVerifier
    }));

    expect(response.status).toBe(401);
    expect(mockPrisma.mobileOAuthFlow.findUnique).not.toHaveBeenCalled();
  });

  test("state不一致を拒否する", async () => {
    mockPrisma.mobileOAuthFlow.updateMany.mockResolvedValue({ count: 0 });

    const response = await exchangeGoogleCode(postJson("/api/mobile/auth/google/exchange", {
      code,
      state: "state_ZYXWVUTSRQPONMLKJIHGFEDCBAzyxwvutsrqpon",
      codeVerifier
    }));

    expect(response.status).toBe(401);
  });

  test("codeVerifier不一致を拒否する", async () => {
    mockPrisma.mobileOAuthFlow.updateMany.mockResolvedValue({ count: 0 });

    const response = await exchangeGoogleCode(postJson("/api/mobile/auth/google/exchange", {
      code,
      state,
      codeVerifier: "verifier_ZYXWVUTSRQPONMLKJIHGFEDCBAzyxwvuts"
    }));

    expect(response.status).toBe(401);
  });

  test("期限切れcodeと使用済みcodeを拒否する", async () => {
    mockPrisma.mobileOAuthFlow.updateMany.mockResolvedValue({ count: 0 });

    const expired = await exchangeGoogleCode(postJson("/api/mobile/auth/google/exchange", {
      code,
      state,
      codeVerifier
    }));
    const used = await exchangeGoogleCode(postJson("/api/mobile/auth/google/exchange", {
      code,
      state,
      codeVerifier
    }));

    expect(expired.status).toBe(401);
    expect(used.status).toBe(401);
  });

  test("同時交換でも1回しか成功しない", async () => {
    mockPrisma.mobileOAuthFlow.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });
    mockPrisma.mobileOAuthFlow.findUnique.mockResolvedValue({
      user: { id: "user-1", name: "卓球 太郎", email: "user@example.com" }
    });

    const first = await exchangeGoogleCode(postJson("/api/mobile/auth/google/exchange", {
      code,
      state,
      codeVerifier
    }));
    const second = await exchangeGoogleCode(postJson("/api/mobile/auth/google/exchange", {
      code,
      state,
      codeVerifier
    }));

    expect(first.status).toBe(200);
    expect(second.status).toBe(401);
    expect(mockPrisma.mobileOAuthFlow.findUnique).toHaveBeenCalledTimes(1);
  });

  test("削除済みUserでは発行しない", async () => {
    mockPrisma.mobileOAuthFlow.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.mobileOAuthFlow.findUnique.mockResolvedValue({ user: null });

    const response = await exchangeGoogleCode(postJson("/api/mobile/auth/google/exchange", {
      code,
      state,
      codeVerifier
    }));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).not.toHaveProperty("accessToken");
  });

  test("body内のuserIdを信用せずGoogle tokenやpasswordHashを返さない", async () => {
    mockPrisma.mobileOAuthFlow.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.mobileOAuthFlow.findUnique.mockResolvedValue({
      user: { id: "user-1", name: "卓球 太郎", email: "user@example.com" }
    });

    const response = await exchangeGoogleCode(postJson("/api/mobile/auth/google/exchange", {
      code,
      state,
      codeVerifier,
      userId: "attacker"
    }));
    const bodyText = await response.text();

    expect(response.status).toBe(400);
    expect(bodyText).not.toContain("attacker");
    expect(bodyText).not.toContain("id_token");
    expect(bodyText).not.toContain("refresh_token");
    expect(bodyText).not.toContain("passwordHash");
  });
});
