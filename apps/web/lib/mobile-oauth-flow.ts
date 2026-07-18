import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { prisma } from "@table-tennis/db";
import { z } from "zod";
import { createMobileAccessToken } from "@/lib/mobile-auth";

export const mobileOAuthCallbackUri = "tabletennis://auth/callback";
export const mobileOAuthIntentCookieName = "ttl_mobile_oauth_flow";
export const mobileOAuthFlowTtlMs = 10 * 60 * 1000;
export const mobileOAuthCodeTtlMs = 3 * 60 * 1000;

const mobileOAuthTokenPattern = /^[A-Za-z0-9_-]+$/;
const flowIdPattern = /^[A-Za-z0-9_-]+$/;
const rateLimitWindowMs = 60 * 1000;
const cleanupGraceMs = 60 * 60 * 1000;
const encoder = new TextEncoder();

export const mobileOAuthErrorCodes = [
  "invalid_request",
  "oauth_failed",
  "oauth_account_not_linked",
  "legal_consent_required",
  "email_not_verified",
  "expired",
  "state_mismatch"
] as const;

export type MobileOAuthErrorCode = (typeof mobileOAuthErrorCodes)[number];

export const mobileOAuthStateSchema = z
  .string()
  .min(32, "不正なログイン要求です")
  .max(128, "不正なログイン要求です")
  .regex(mobileOAuthTokenPattern, "不正なログイン要求です");

export const mobileOAuthCodeChallengeSchema = z
  .string()
  .length(43, "不正なログイン要求です")
  .regex(mobileOAuthTokenPattern, "不正なログイン要求です");

export const mobileOAuthCodeVerifierSchema = z
  .string()
  .min(43, "不正なログイン要求です")
  .max(128, "不正なログイン要求です")
  .regex(mobileOAuthTokenPattern, "不正なログイン要求です");

export const mobileOAuthAuthorizationCodeSchema = z
  .string()
  .min(32, "不正なログイン要求です")
  .max(128, "不正なログイン要求です")
  .regex(mobileOAuthTokenPattern, "不正なログイン要求です");

export const mobileOAuthStartSchema = z
  .object({
    state: mobileOAuthStateSchema,
    codeChallenge: mobileOAuthCodeChallengeSchema,
    legalConsent: z.boolean().optional()
  })
  .strict();

export const mobileOAuthExchangeSchema = z
  .object({
    code: mobileOAuthAuthorizationCodeSchema,
    state: mobileOAuthStateSchema,
    codeVerifier: mobileOAuthCodeVerifierSchema
  })
  .strict();

export const mobileOAuthBrowserQuerySchema = z.object({
  flow: z
    .string()
    .min(8, "不正なログイン要求です")
    .max(128, "不正なログイン要求です")
    .regex(flowIdPattern, "不正なログイン要求です"),
  state: mobileOAuthStateSchema
});

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function sha256Base64Url(value: string) {
  return createHash("sha256").update(value, "utf8").digest("base64url");
}

export function createCodeChallenge(codeVerifier: string) {
  return sha256Base64Url(codeVerifier);
}

export function hashMobileOAuthValue(value: string) {
  return sha256Base64Url(value);
}

export function generateMobileOAuthCode() {
  return randomBytes(32).toString("base64url");
}

export function getPublicWebOrigin(request: Request) {
  const configured = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;

  if (configured) {
    try {
      const url = new URL(configured);

      if (url.protocol === "https:" || url.protocol === "http:") {
        return url.origin;
      }
    } catch {
      // Fall back to the request origin below.
    }
  }

  return new URL(request.url).origin;
}

export function buildMobileOAuthCallbackUrl({
  code,
  error,
  state
}: {
  code?: string;
  error?: MobileOAuthErrorCode;
  state?: string;
}) {
  const url = new URL(mobileOAuthCallbackUri);

  if (code) {
    url.searchParams.set("code", code);
  }

  if (error) {
    url.searchParams.set("error", error);
  }

  if (state && mobileOAuthStateSchema.safeParse(state).success) {
    url.searchParams.set("state", state);
  }

  return url.toString();
}

export function normalizeMobileOAuthErrorCode(value: unknown): MobileOAuthErrorCode {
  return typeof value === "string" && mobileOAuthErrorCodes.includes(value as MobileOAuthErrorCode)
    ? (value as MobileOAuthErrorCode)
    : "oauth_failed";
}

export function serializeMobileOAuthIntent(flow: string, state: string) {
  return Buffer.from(JSON.stringify({ flow, state })).toString("base64url");
}

export function parseMobileOAuthIntent(value: string | undefined | null) {
  if (!value) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as unknown;
    const parsed = mobileOAuthBrowserQuerySchema.safeParse(decoded);

    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function buildMobileOAuthErrorRedirectPath(error: MobileOAuthErrorCode, intent: { flow: string; state: string }) {
  const url = new URL("/mobile-auth/google/error", "https://table-tennis.invalid");
  url.searchParams.set("flow", intent.flow);
  url.searchParams.set("state", intent.state);
  url.searchParams.set("error", error);

  return `${url.pathname}${url.search}`;
}

export function consumeMobileOAuthRateLimit(request: Request, operation: string, limit = 20) {
  const now = Date.now();
  const clientIp = getClientIp(request);
  const key = `${operation}:${clientIp}`;
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + rateLimitWindowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000))
    };
  }

  current.count += 1;
  rateLimitStore.set(key, current);

  return { allowed: true, retryAfterSeconds: 0 };
}

export function clearMobileOAuthRateLimitForTest() {
  rateLimitStore.clear();
}

export async function createMobileOAuthFlow({
  codeChallenge,
  legalConsent,
  origin,
  state,
  now = new Date()
}: {
  codeChallenge: string;
  legalConsent?: boolean;
  origin: string;
  state: string;
  now?: Date;
}) {
  await cleanupExpiredMobileOAuthFlows(now);

  const flow = await prisma.mobileOAuthFlow.create({
    data: {
      stateHash: hashMobileOAuthValue(state),
      codeChallenge,
      legalConsent: legalConsent === true,
      expiresAt: new Date(now.getTime() + mobileOAuthFlowTtlMs)
    },
    select: {
      id: true
    }
  });
  const authorizationUrl = new URL("/mobile-auth/google", origin);
  authorizationUrl.searchParams.set("flow", flow.id);
  authorizationUrl.searchParams.set("state", state);

  return {
    authorizationUrl: authorizationUrl.toString(),
    flowId: flow.id
  };
}

export async function findValidMobileOAuthBrowserFlow(flowId: string, state: string, now = new Date()) {
  const flow = await prisma.mobileOAuthFlow.findUnique({
    where: { id: flowId },
    select: {
      id: true,
      stateHash: true,
      legalConsent: true,
      expiresAt: true,
      completedAt: true,
      usedAt: true,
      createdAt: true
    }
  });

  if (!flow || flow.expiresAt <= now || flow.completedAt || flow.usedAt) {
    return null;
  }

  if (!safeEqualString(hashMobileOAuthValue(state), flow.stateHash)) {
    return null;
  }

  return flow;
}

export async function completeMobileOAuthFlow({
  flowId,
  googleReauthenticatedAt,
  state,
  userId,
  now = new Date()
}: {
  flowId: string;
  googleReauthenticatedAt?: number | null;
  state: string;
  userId?: string | null;
  now?: Date;
}) {
  const flow = await findValidMobileOAuthBrowserFlow(flowId, state, now);

  if (!flow) {
    return { ok: false as const, error: "expired" as MobileOAuthErrorCode };
  }

  if (!userId || !googleReauthenticatedAt || !isGoogleLoginFreshForFlow(flow.createdAt, googleReauthenticatedAt, now)) {
    return { ok: false as const, error: "oauth_failed" as MobileOAuthErrorCode };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true }
  });

  if (!user) {
    return { ok: false as const, error: "oauth_failed" as MobileOAuthErrorCode };
  }

  const code = generateMobileOAuthCode();
  const codeHash = hashMobileOAuthValue(code);
  const stateHash = hashMobileOAuthValue(state);
  const updated = await prisma.mobileOAuthFlow.updateMany({
    where: {
      id: flow.id,
      stateHash,
      expiresAt: { gt: now },
      completedAt: null,
      usedAt: null
    },
    data: {
      codeHash,
      userId: user.id,
      completedAt: now,
      expiresAt: new Date(now.getTime() + mobileOAuthCodeTtlMs)
    }
  });

  if (updated.count !== 1) {
    return { ok: false as const, error: "oauth_failed" as MobileOAuthErrorCode };
  }

  return { ok: true as const, code, state };
}

export async function exchangeMobileOAuthCode({
  code,
  codeVerifier,
  state,
  now = new Date()
}: {
  code: string;
  codeVerifier: string;
  state: string;
  now?: Date;
}) {
  const codeHash = hashMobileOAuthValue(code);
  const stateHash = hashMobileOAuthValue(state);
  const codeChallenge = createCodeChallenge(codeVerifier);
  const updated = await prisma.mobileOAuthFlow.updateMany({
    where: {
      codeHash,
      stateHash,
      codeChallenge,
      completedAt: { not: null },
      usedAt: null,
      userId: { not: null },
      expiresAt: { gt: now }
    },
    data: {
      usedAt: now
    }
  });

  if (updated.count !== 1) {
    return { ok: false as const, error: "invalid_request" as MobileOAuthErrorCode };
  }

  const flow = await prisma.mobileOAuthFlow.findUnique({
    where: { codeHash },
    select: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  if (!flow?.user) {
    return { ok: false as const, error: "oauth_failed" as MobileOAuthErrorCode };
  }

  return {
    ok: true as const,
    accessToken: createMobileAccessToken(flow.user.id),
    user: flow.user
  };
}

async function cleanupExpiredMobileOAuthFlows(now: Date) {
  await prisma.mobileOAuthFlow.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(now.getTime() - cleanupGraceMs)
      }
    }
  });
}

function safeEqualString(left: string, right: string) {
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);

  return leftBytes.byteLength === rightBytes.byteLength && timingSafeEqual(leftBytes, rightBytes);
}

function isGoogleLoginFreshForFlow(flowCreatedAt: Date, googleReauthenticatedAt: number, now: Date) {
  const reauthenticatedAtMs = googleReauthenticatedAt * 1000;

  return reauthenticatedAtMs >= flowCreatedAt.getTime() - 5000 && reauthenticatedAtMs <= now.getTime() + 60_000;
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const cfIp = request.headers.get("cf-connecting-ip")?.trim();

  return forwardedFor || realIp || cfIp || "unknown";
}
