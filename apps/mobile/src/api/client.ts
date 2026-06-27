import { clearAccessToken, getAccessToken } from "@/storage/token";

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

function getBaseUrl() {
  if (!apiUrl) {
    throw new ApiError("EXPO_PUBLIC_API_URL が設定されていません", 500);
  }

  return apiUrl.replace(/\/$/, "");
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  const headers = new Headers(options.headers);

  headers.set("Accept", "application/json");

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${getBaseUrl()}${path}`, {
    ...options,
    headers
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      await clearAccessToken();
    }

    throw new ApiError(body.error ?? "通信に失敗しました", response.status);
  }

  return body as T;
}
