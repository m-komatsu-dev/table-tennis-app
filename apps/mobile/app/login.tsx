import { useEffect, useState } from "react";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { fetchMe, login } from "@/api/auth";
import { ApiError, apiStatus } from "@/api/client";
import { useGoogleLogin } from "@/auth/google";
import { Button, Card, ErrorMessage, Screen, TextField, colors, styles } from "@/components/ui";
import { getAccessToken, saveAccessToken } from "@/storage/token";

function getLoginErrorMessage(caught: unknown) {
  if (caught instanceof ApiError) {
    if (caught.status === apiStatus.missingUrl) {
      return "API URLが設定されていません";
    }
    if (caught.status === apiStatus.network) {
      return "サーバーに接続できません。通信環境またはAPI URLを確認してください";
    }
    if (caught.status === 401) {
      return "メールアドレスまたはパスワードが違います";
    }
    if (caught.status >= 500) {
      return "サーバー側でエラーが発生しました";
    }
  }

  return "ログインに失敗しました";
}

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const googleLogin = useGoogleLogin();

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      const token = await getAccessToken();
      if (!token) {
        return;
      }

      try {
        await fetchMe();
        if (mounted) {
          router.replace("/(tabs)/home");
        }
      } catch {
        // apiRequest clears invalid tokens on 401.
      }
    }

    restoreSession();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleLogin() {
    setError(null);
    setLoading(true);

    try {
      const result = await login(email, password);
      await saveAccessToken(result.accessToken);
      router.replace("/(tabs)/home");
    } catch (caught) {
      setError(getLoginErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen keyboardAware>
      <Pressable onPress={() => router.push("/")} style={{ alignSelf: "flex-start", paddingVertical: 4 }}>
        <Text style={{ color: colors.primary, fontSize: 14, fontWeight: "800" }}>← ホームへ戻る</Text>
      </Pressable>

      <View style={{ gap: 8, marginTop: 36 }}>
        <Text style={[styles.title, { fontSize: 30 }]}>卓球記録</Text>
        <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 22 }}>
          Web版のメールアドレスとパスワードでログインします。
        </Text>
      </View>

      <Card>
        <TextField
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          label="メールアドレス"
          onChangeText={setEmail}
          placeholder="user@example.com"
          value={email}
        />
        <TextField
          autoCapitalize="none"
          label="パスワード"
          onChangeText={setPassword}
          placeholder="パスワードを入力"
          secureTextEntry
          value={password}
        />
        <ErrorMessage message={error ?? googleLogin.error} />
        <Button disabled={googleLogin.loading} loading={loading} onPress={handleLogin}>
          ログイン
        </Button>
        <View style={{ alignItems: "center", paddingVertical: 2 }}>
          <Text style={{ color: colors.faint, fontSize: 13, fontWeight: "700" }}>または</Text>
        </View>
        <Button
          disabled={loading}
          loading={googleLogin.loading}
          loadingLabel="Googleへ移動中..."
          onPress={googleLogin.startGoogleLogin}
          variant="secondary"
        >
          Googleでログイン
        </Button>
        {googleLogin.unavailableMessage ? (
          <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 19 }}>
            {googleLogin.unavailableMessage}
          </Text>
        ) : null}
      </Card>

      <Pressable onPress={() => router.push("/register")} style={{ alignItems: "center", minHeight: 44, justifyContent: "center" }}>
        <Text style={{ color: colors.primaryDark, fontSize: 14, fontWeight: "800" }}>
          アカウントをお持ちでない方は新規登録
        </Text>
      </Pressable>
    </Screen>
  );
}
