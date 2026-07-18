import { useRef, useState } from "react";
import { router } from "expo-router";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Crypto from "expo-crypto";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import { exchangeGoogleBrowserLogin, startGoogleBrowserLogin } from "@/api/auth";
import { ApiError, apiStatus } from "@/api/client";
import { saveAccessToken } from "@/storage/token";

WebBrowser.maybeCompleteAuthSession();

const callbackRedirectUri = "tabletennis://auth/callback";
const pendingStateKey = "table-tennis-google-browser-state";
const pendingCodeVerifierKey = "table-tennis-google-browser-code-verifier";
const expoGoGoogleLoginMessage =
  "Googleログインはpreview APKで利用できます。現在はメールアドレス・パスワードでログインしてください。";
const legalConsentRequiredMessage = "利用規約への同意とプライバシーポリシーの確認が必要です。";
const base64UrlChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

type LoadingStage = "preparing" | "browser" | "exchanging" | null;
type CallbackParams = Record<string, string | string[] | undefined>;
type GoogleBrowserLoginResult = { status: "success" | "handled" };

const callbackPromises = new Map<string, Promise<GoogleBrowserLoginResult>>();

class GoogleBrowserLoginError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

function isExpoGo() {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient || Constants.appOwnership === "expo";
}

function bytesToBase64Url(bytes: Uint8Array) {
  let output = "";

  for (const byte of bytes) {
    output += base64UrlChars[byte & 63];
  }

  return output;
}

function base64ToBase64Url(value: string) {
  return value.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function randomUrlToken(byteLength = 48) {
  return bytesToBase64Url(await Crypto.getRandomBytesAsync(byteLength));
}

async function createCodeChallenge(codeVerifier: string) {
  const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, codeVerifier, {
    encoding: Crypto.CryptoEncoding.BASE64
  });

  return base64ToBase64Url(digest);
}

async function savePendingGoogleFlow(state: string, codeVerifier: string) {
  await SecureStore.setItemAsync(pendingStateKey, state);
  await SecureStore.setItemAsync(pendingCodeVerifierKey, codeVerifier);
}

async function readPendingGoogleFlow() {
  const [state, codeVerifier] = await Promise.all([
    SecureStore.getItemAsync(pendingStateKey),
    SecureStore.getItemAsync(pendingCodeVerifierKey)
  ]);

  return { state, codeVerifier };
}

export async function clearPendingGoogleLogin() {
  await Promise.allSettled([
    SecureStore.deleteItemAsync(pendingStateKey),
    SecureStore.deleteItemAsync(pendingCodeVerifierKey)
  ]);
}

function getParam(params: CallbackParams, name: string) {
  const value = params[name];

  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : null;
  }

  return typeof value === "string" ? value : null;
}

function parseCallbackUrl(url: string): CallbackParams {
  const parsed = Linking.parse(url);

  return (parsed.queryParams ?? {}) as CallbackParams;
}

function callbackKey(params: CallbackParams) {
  const code = getParam(params, "code") ?? "";
  const state = getParam(params, "state") ?? "";
  const error = getParam(params, "error") ?? "";

  return `${state}:${code ? "code" : "error"}:${code || error}`;
}

function getDeepLinkErrorCode(error: string | null) {
  switch (error) {
    case "expired":
      return "expired";
    case "state_mismatch":
      return "state_mismatch";
    case "oauth_account_not_linked":
      return "oauth_account_not_linked";
    case "legal_consent_required":
      return "legal_consent_required";
    case "email_not_verified":
      return "email_not_verified";
    case "invalid_request":
      return "invalid_callback";
    default:
      return "oauth_failed";
  }
}

export function getGoogleErrorMessage(caught: unknown) {
  if (caught instanceof GoogleBrowserLoginError) {
    switch (caught.code) {
      case "cancelled":
        return "Googleログインをキャンセルしました。";
      case "expired":
        return "ログインの有効期限が切れました。もう一度お試しください。";
      case "state_mismatch":
      case "invalid_callback":
        return "不正なログイン結果を受信しました。";
      case "oauth_account_not_linked":
        return "このメールアドレスは別のログイン方法で登録されています。登録時の方法でログインしてください。";
      case "legal_consent_required":
        return legalConsentRequiredMessage;
      case "email_not_verified":
        return "Googleアカウントのメールアドレス確認が完了していません。";
      case "save_failed":
        return "ログイン情報を保存できませんでした。";
      default:
        return "Googleログインを完了できませんでした。";
    }
  }

  if (caught instanceof ApiError) {
    if (caught.status === apiStatus.missingUrl) {
      return "API URLが設定されていません。";
    }
    if (caught.status === apiStatus.network) {
      return "通信状況を確認して、もう一度お試しください。";
    }
    if (caught.status === 400 || caught.status === 401) {
      return "Googleログインを完了できませんでした。";
    }
    if (caught.status === 409) {
      return "このメールアドレスは別のログイン方法で登録されています。登録時の方法でログインしてください。";
    }
    if (caught.status === 429) {
      return "しばらく待ってからもう一度お試しください。";
    }
    if (caught.status >= 500) {
      return "Googleログインを完了できませんでした。";
    }
  }

  return "Googleログインを完了できませんでした。";
}

export async function completeGoogleBrowserLoginFromUrl(url: string) {
  return completeGoogleBrowserLoginFromParams(parseCallbackUrl(url));
}

export async function completeGoogleBrowserLoginFromParams(params: CallbackParams): Promise<GoogleBrowserLoginResult> {
  const key = callbackKey(params);
  const existing = callbackPromises.get(key);

  if (existing) {
    return existing;
  }

  const promise = finishGoogleBrowserLoginFromParams(params).finally(() => {
    setTimeout(() => {
      callbackPromises.delete(key);
    }, 2000);
  });

  callbackPromises.set(key, promise);

  return promise;
}

async function finishGoogleBrowserLoginFromParams(params: CallbackParams): Promise<GoogleBrowserLoginResult> {
  const code = getParam(params, "code");
  const state = getParam(params, "state");
  const error = getParam(params, "error");
  const pending = await readPendingGoogleFlow();

  try {
    if (!pending.state || !pending.codeVerifier) {
      throw new GoogleBrowserLoginError("invalid_callback");
    }

    if (!state || state !== pending.state) {
      throw new GoogleBrowserLoginError("state_mismatch");
    }

    if (error) {
      throw new GoogleBrowserLoginError(getDeepLinkErrorCode(error));
    }

    if (!code) {
      throw new GoogleBrowserLoginError("invalid_callback");
    }

    const result = await exchangeGoogleBrowserLogin({
      code,
      state,
      codeVerifier: pending.codeVerifier
    });

    try {
      await saveAccessToken(result.accessToken);
    } catch {
      throw new GoogleBrowserLoginError("save_failed");
    }

    await clearPendingGoogleLogin();

    return { status: "success" };
  } catch (caught) {
    await clearPendingGoogleLogin();
    throw caught;
  }
}

function loadingLabel(stage: LoadingStage) {
  switch (stage) {
    case "preparing":
      return "Googleログインを準備しています…";
    case "browser":
      return "ブラウザでGoogleログインを完了してください…";
    case "exchanging":
      return "ログイン情報を確認しています…";
    default:
      return "Googleへ移動中…";
  }
}

export function useGoogleLogin(options: { legalConsent?: boolean; requireLegalConsent?: boolean } = {}) {
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<LoadingStage>(null);
  const inFlightRef = useRef(false);
  const loading = stage !== null;

  async function startGoogleLogin() {
    if (inFlightRef.current) {
      return;
    }

    inFlightRef.current = true;
    setError(null);

    if (options.requireLegalConsent && !options.legalConsent) {
      inFlightRef.current = false;
      setError(legalConsentRequiredMessage);
      return;
    }

    if (isExpoGo()) {
      inFlightRef.current = false;
      setError(expoGoGoogleLoginMessage);
      return;
    }

    setStage("preparing");

    try {
      await clearPendingGoogleLogin();

      const state = await randomUrlToken();
      const codeVerifier = await randomUrlToken();
      const codeChallenge = await createCodeChallenge(codeVerifier);

      try {
        await savePendingGoogleFlow(state, codeVerifier);
      } catch {
        throw new GoogleBrowserLoginError("save_failed");
      }

      const startResult = await startGoogleBrowserLogin({
        state,
        codeChallenge,
        legalConsent: options.legalConsent
      });

      setStage("browser");

      const browserResult = await WebBrowser.openAuthSessionAsync(startResult.authorizationUrl, callbackRedirectUri);

      if (browserResult.type === "cancel" || browserResult.type === "dismiss") {
        throw new GoogleBrowserLoginError("cancelled");
      }

      if (browserResult.type !== "success" || !browserResult.url) {
        throw new GoogleBrowserLoginError("oauth_failed");
      }

      setStage("exchanging");
      await completeGoogleBrowserLoginFromUrl(browserResult.url);
      router.replace("/(tabs)/home");
    } catch (caught) {
      setError(getGoogleErrorMessage(caught));
      await clearPendingGoogleLogin();
    } finally {
      inFlightRef.current = false;
      setStage(null);
    }
  }

  return {
    error,
    unavailableMessage: isExpoGo() ? expoGoGoogleLoginMessage : null,
    loading,
    loadingLabel: loadingLabel(stage),
    startGoogleLogin
  };
}
