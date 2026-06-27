import { createHmac, timingSafeEqual } from "node:crypto";

const encoder = new TextEncoder();
const tokenTtlSeconds = 60 * 60 * 24 * 30;

export class MobileAuthConfigError extends Error {
  constructor() {
    super("MOBILE_AUTH_SECRET must be set to at least 32 characters.");
  }
}

export type MobileTokenPayload = {
  userId: string;
  iat: number;
  exp: number;
};

function getMobileAuthSecret() {
  const secret = process.env.MOBILE_AUTH_SECRET ?? process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

  if (!secret || secret.trim().length < 32) {
    throw new MobileAuthConfigError();
  }

  return secret;
}

function base64UrlEncode(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlJson(value: unknown) {
  return base64UrlEncode(JSON.stringify(value));
}

function sign(input: string, secret: string) {
  return createHmac("sha256", secret).update(input).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const left = encoder.encode(a);
  const right = encoder.encode(b);

  return left.byteLength === right.byteLength && timingSafeEqual(left, right);
}

function decodeJsonPart(part: string) {
  return JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as unknown;
}

export function createMobileAccessToken(userId: string) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlJson({ alg: "HS256", typ: "JWT" });
  const payload = base64UrlJson({
    userId,
    iat: now,
    exp: now + tokenTtlSeconds
  } satisfies MobileTokenPayload);
  const unsignedToken = `${header}.${payload}`;
  const signature = sign(unsignedToken, getMobileAuthSecret());

  return `${unsignedToken}.${signature}`;
}

export function verifyMobileAccessToken(token: string): MobileTokenPayload | null {
  try {
    const [header, payload, signature] = token.split(".");

    if (!header || !payload || !signature) {
      return null;
    }

    const expectedSignature = sign(`${header}.${payload}`, getMobileAuthSecret());

    if (!safeEqual(signature, expectedSignature)) {
      return null;
    }

    const decodedHeader = decodeJsonPart(header);
    if (
      !decodedHeader ||
      typeof decodedHeader !== "object" ||
      !("alg" in decodedHeader) ||
      decodedHeader.alg !== "HS256"
    ) {
      return null;
    }

    const decodedPayload = decodeJsonPart(payload);
    if (
      !decodedPayload ||
      typeof decodedPayload !== "object" ||
      !("userId" in decodedPayload) ||
      typeof decodedPayload.userId !== "string" ||
      !("exp" in decodedPayload) ||
      typeof decodedPayload.exp !== "number" ||
      !("iat" in decodedPayload) ||
      typeof decodedPayload.iat !== "number"
    ) {
      return null;
    }

    if (decodedPayload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      userId: decodedPayload.userId,
      iat: decodedPayload.iat,
      exp: decodedPayload.exp
    };
  } catch {
    return null;
  }
}

export function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

export function requireMobileUserId(request: Request) {
  const token = getBearerToken(request);

  if (!token) {
    return null;
  }

  return verifyMobileAccessToken(token)?.userId ?? null;
}
