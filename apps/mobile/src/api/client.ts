import { clearAccessToken, getAccessToken } from "@/storage/token";

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

export const apiStatus = {
  missingUrl: -1,
  network: 0
} as const;

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

function getBaseUrl() {
  if (!apiUrl) {
    throw new ApiError("API URLが設定されていません", apiStatus.missingUrl);
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

  let response: Response;

  try {
    response = await fetch(`${getBaseUrl()}${path}`, {
      ...options,
      headers
    });
  } catch {
    throw new ApiError("サーバーに接続できません", apiStatus.network);
  }

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      await clearAccessToken();
    }

    throw new ApiError(apiErrorMessage(response.status), response.status);
  }

  return body as T;
}

function apiErrorMessage(status: number) {
  if (status === 400) {
    return "入力内容を確認してください";
  }

  if (status === 401) {
    return "ログインし直してください";
  }

  if (status >= 500) {
    return "サーバー側でエラーが発生しました";
  }

  return "通信に失敗しました";
}
