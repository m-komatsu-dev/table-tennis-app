import { apiRequest } from "@/api/client";
import type { Gender, Level, User } from "@/types";

export type UpdateProfileInput = {
  name: string;
  username?: string | null;
  level: Level;
  gender: Gender | null;
  publicProfileEnabled: boolean;
};

export async function fetchProfile() {
  return apiRequest<{ user: User }>("/api/mobile/profile");
}

export async function updateProfile(input: UpdateProfileInput) {
  return apiRequest<{ user: User }>("/api/mobile/profile", {
    method: "PUT",
    body: JSON.stringify(input)
  });
}

export type AccountDeletionStatus = {
  authMethod: "password" | "google" | "unsupported";
  isGoogleReauthenticated: boolean;
};

export type DeleteAccountInput = {
  currentPassword?: string;
  confirmationText: string;
  confirmedIrreversible: boolean;
};

export async function fetchAccountDeletionStatus() {
  return apiRequest<AccountDeletionStatus>("/api/mobile/account");
}

export async function deleteAccount(input: DeleteAccountInput) {
  return apiRequest<{ success: true }>("/api/mobile/account", {
    method: "DELETE",
    body: JSON.stringify(input)
  });
}
