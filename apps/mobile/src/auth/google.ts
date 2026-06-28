import { useEffect, useMemo, useRef, useState } from "react";
import { router } from "expo-router";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { loginWithGoogle } from "@/api/auth";
import { ApiError, apiStatus } from "@/api/client";
import { saveAccessToken } from "@/storage/token";

WebBrowser.maybeCompleteAuthSession();

const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
const googleExpoClientId = process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID ?? googleWebClientId;
const googleAndroidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? googleExpoClientId;
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? googleExpoClientId;
const missingGoogleClientId = "missing-google-client-id.apps.googleusercontent.com";
const expoGoGoogleLoginMessage =
  "Googleログインは開発ビルドで利用できます。現在はメールアドレス・パスワードでログインしてください。";

function isExpoGo() {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient || Constants.appOwnership === "expo";
}

function getGoogleErrorMessage(caught: unknown) {
  if (caught instanceof ApiError) {
    if (caught.status === apiStatus.missingUrl) {
      return "API URLが設定されていません";
    }
    if (caught.status === apiStatus.network) {
      return "サーバーに接続できません";
    }
    if (caught.status === 400) {
      return "Googleログイン情報が不正です";
    }
    if (caught.status === 401) {
      return "Googleログインに失敗しました";
    }
    if (caught.status === 409) {
      return "このメールアドレスは別の方法で登録されています";
    }
    if (caught.status >= 500) {
      return "サーバー側でエラーが発生しました";
    }
  }

  return "Googleログインに失敗しました。時間をおいて再度お試しください";
}

export function useGoogleLogin() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const handledResponseKey = useRef<string | null>(null);
  const isConfigured = Boolean(googleExpoClientId || googleWebClientId || googleAndroidClientId || googleIosClientId);
  const clientConfig = useMemo(
    () => ({
      clientId: googleExpoClientId ?? missingGoogleClientId,
      webClientId: googleWebClientId ?? missingGoogleClientId,
      androidClientId: googleAndroidClientId ?? missingGoogleClientId,
      iosClientId: googleIosClientId ?? missingGoogleClientId,
      scopes: ["openid", "profile", "email"],
      selectAccount: true
    }),
    []
  );
  const [request, response, promptAsync] = Google.useAuthRequest(clientConfig, {
    scheme: "tabletennis"
  });

  useEffect(() => {
    if (!response) {
      return;
    }

    const responseKey =
      response.type === "success" || response.type === "error"
        ? `${response.type}:${response.url}:${response.params.id_token ?? ""}`
        : response.type;
    if (handledResponseKey.current === responseKey) {
      return;
    }
    handledResponseKey.current = responseKey;

    if (response.type === "cancel" || response.type === "dismiss") {
      setLoading(false);
      setError("ログインをキャンセルしました");
      return;
    }

    if (response.type !== "success") {
      setLoading(false);
      setError("Googleログインに失敗しました。時間をおいて再度お試しください");
      return;
    }

    const idToken = response.params.id_token;
    const nonce = request?.nonce;

    if (!idToken) {
      setLoading(false);
      setError("Googleログインに失敗しました。時間をおいて再度お試しください");
      return;
    }

    async function finishGoogleLogin() {
      try {
        const result = await loginWithGoogle(idToken, nonce);
        await saveAccessToken(result.accessToken);
        router.replace("/(tabs)/home");
      } catch (caught) {
        setError(getGoogleErrorMessage(caught));
      } finally {
        setLoading(false);
      }
    }

    finishGoogleLogin();
  }, [request?.nonce, response]);

  async function startGoogleLogin() {
    setError(null);

    if (isExpoGo()) {
      setError(expoGoGoogleLoginMessage);
      return;
    }

    if (!isConfigured) {
      setError("Googleログイン設定が不足しています");
      return;
    }

    if (!request) {
      setError("Googleログインの準備中です。少し待ってから再度お試しください");
      return;
    }

    setLoading(true);

    try {
      const result = await promptAsync();
      if (result.type === "cancel" || result.type === "dismiss") {
        setLoading(false);
        setError("ログインをキャンセルしました");
      } else if (result.type !== "success") {
        setLoading(false);
        setError("Googleログインに失敗しました。時間をおいて再度お試しください");
      }
    } catch {
      setLoading(false);
      setError("Googleログインに失敗しました。時間をおいて再度お試しください");
    }
  }

  return {
    error,
    unavailableMessage: isExpoGo() ? expoGoGoogleLoginMessage : null,
    loading,
    startGoogleLogin
  };
}
