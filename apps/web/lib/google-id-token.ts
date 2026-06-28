import { OAuth2Client } from "google-auth-library";

const googleIssuers = new Set(["accounts.google.com", "https://accounts.google.com"]);

export class GoogleAuthConfigError extends Error {
  constructor() {
    super("Google OAuth client ID is not configured.");
  }
}

export class GoogleIdTokenVerificationError extends Error {
  constructor() {
    super("Google ID token verification failed.");
  }
}

export type VerifiedGoogleIdToken = {
  sub: string;
  email: string;
  name: string | null;
  picture: string | null;
};

function splitClientIds(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export function getAllowedGoogleClientIds() {
  const ids = [
    ...splitClientIds(process.env.GOOGLE_MOBILE_CLIENT_IDS),
    ...splitClientIds(process.env.GOOGLE_CLIENT_ID),
    ...splitClientIds(process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID),
    ...splitClientIds(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID),
    ...splitClientIds(process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID),
    ...splitClientIds(process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID),
    ...splitClientIds(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID)
  ];

  return Array.from(new Set(ids));
}

function isVerifiedEmail(value: unknown) {
  return value === true || value === "true";
}

function validatePayloadString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export async function verifyGoogleIdToken(idToken: string, expectedNonce?: string | null): Promise<VerifiedGoogleIdToken> {
  const audience = getAllowedGoogleClientIds();

  if (audience.length === 0) {
    throw new GoogleAuthConfigError();
  }

  try {
    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({
      idToken,
      audience
    });
    const payload = ticket.getPayload();
    const now = Math.floor(Date.now() / 1000);

    if (!payload) {
      throw new GoogleIdTokenVerificationError();
    }

    const sub = validatePayloadString(payload.sub);
    const email = validatePayloadString(payload.email)?.toLowerCase() ?? null;
    const issuer = validatePayloadString(payload.iss);
    const audienceClaim = validatePayloadString(payload.aud);

    if (
      !sub ||
      !email ||
      !issuer ||
      !googleIssuers.has(issuer) ||
      !audienceClaim ||
      !audience.includes(audienceClaim) ||
      typeof payload.exp !== "number" ||
      payload.exp <= now ||
      !isVerifiedEmail(payload.email_verified)
    ) {
      throw new GoogleIdTokenVerificationError();
    }

    if (expectedNonce && payload.nonce !== expectedNonce) {
      throw new GoogleIdTokenVerificationError();
    }

    return {
      sub,
      email,
      name: validatePayloadString(payload.name),
      picture: validatePayloadString(payload.picture)
    };
  } catch (error) {
    if (error instanceof GoogleAuthConfigError || error instanceof GoogleIdTokenVerificationError) {
      throw error;
    }

    throw new GoogleIdTokenVerificationError();
  }
}
