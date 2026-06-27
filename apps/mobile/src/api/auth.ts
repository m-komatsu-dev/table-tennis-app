import { apiRequest } from "@/api/client";
import type { User } from "@/types";

export async function login(email: string, password: string) {
  return apiRequest<{ accessToken: string; user: User }>("/api/mobile/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

export async function fetchMe() {
  return apiRequest<{ user: User }>("/api/mobile/me");
}
