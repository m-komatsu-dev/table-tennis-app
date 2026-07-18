import { apiRequest } from "@/api/client";
import type { User } from "@/types";

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  legalConsent: boolean;
};

export async function login(email: string, password: string) {
  return apiRequest<{ accessToken: string; user: User }>("/api/mobile/auth/login", {
    auth: false,
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

export async function register(input: RegisterInput) {
  return apiRequest<{ accessToken: string; user: User }>("/api/mobile/auth/register", {
    auth: false,
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function startGoogleBrowserLogin(input: {
  state: string;
  codeChallenge: string;
  legalConsent?: boolean;
}) {
  return apiRequest<{ authorizationUrl: string }>("/api/mobile/auth/google/start", {
    auth: false,
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function exchangeGoogleBrowserLogin(input: {
  code: string;
  state: string;
  codeVerifier: string;
}) {
  return apiRequest<{ accessToken: string; user: User }>("/api/mobile/auth/google/exchange", {
    auth: false,
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function fetchMe() {
  return apiRequest<{ user: User }>("/api/mobile/me");
}
