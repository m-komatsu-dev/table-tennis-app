import { apiRequest } from "@/api/client";
import type { User } from "@/types";

export async function fetchProfile() {
  return apiRequest<{ user: User }>("/api/mobile/profile");
}
