import { clearAccessToken, getAccessToken } from "@/storage/token";

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

export const apiStatus = {
  missingUrl: -1,
  network: 0
} as const;

export class ApiError extends Error {
  constructor(message: string, public status: number, public apiMessage?: string) {
    super(message);
  }
}

type ApiRequestOptions = RequestInit & {
  auth?: boolean;
};

function getBaseUrl() {
  if (!apiUrl) {
    throw new ApiError("API URLが設定されていません", apiStatus.missingUrl);
  }

  return apiUrl.replace(/\/$/, "");
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { auth = true, ...requestOptions } = options;
  const requestUrl = `${getBaseUrl()}${path}`;
  const token = auth ? await getAccessToken() : null;
  const headers = new Headers(requestOptions.headers);

  headers.set("Accept", "application/json");

  if (requestOptions.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (auth) {
    if (!token) {
      logApiError(requestUrl, 401, "missing access token");
      throw new ApiError("ログインし直してください", 401, "missing access token");
    }

    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(requestUrl, {
      ...requestOptions,
      headers
    });
  } catch (error) {
    logApiError(requestUrl, apiStatus.network, error instanceof Error ? error.message : "network error");
    throw new ApiError("サーバーに接続できません", apiStatus.network);
  }

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const apiMessage = extractApiErrorMessage(body);

    if (response.status === 401) {
      await clearAccessToken();
    }

    logApiError(requestUrl, response.status, apiMessage);
    throw new ApiError(apiErrorMessage(response.status), response.status, apiMessage);
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

  if (status === 404) {
    return "APIが見つかりません";
  }

  if (status >= 500) {
    return "サーバー側でエラーが発生しました";
  }

  return "通信に失敗しました";
}

function extractApiErrorMessage(body: unknown) {
  if (typeof body === "object" && body !== null && "error" in body) {
    const error = (body as { error?: unknown }).error;

    if (typeof error === "string") {
      return error;
    }
  }

  return undefined;
}

function logApiError(url: string, status: number, apiMessage?: string) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.error("API request failed", {
    url,
    status,
    message: apiMessage
  });
}
