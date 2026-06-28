import { useState } from "react";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { register } from "@/api/auth";
import { ApiError, apiStatus } from "@/api/client";
import { useGoogleLogin } from "@/auth/google";
import { Button, Card, ErrorMessage, Header, Screen, TextField, colors } from "@/components/ui";
import { saveAccessToken } from "@/storage/token";

function getRegisterErrorMessage(caught: unknown) {
  if (caught instanceof ApiError) {
    if (caught.status === apiStatus.missingUrl) {
      return "API URLが設定されていません";
    }
    if (caught.status === apiStatus.network) {
      return "サーバーに接続できません";
    }
    if (caught.status === 400) {
      return "入力内容を確認してください";
    }
    if (caught.status === 409) {
      return "このメールアドレスはすでに登録されています";
    }
    if (caught.status >= 500) {
      return "サーバー側でエラーが発生しました";
    }
  }

  return "新規登録に失敗しました";
}

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const googleLogin = useGoogleLogin();

  async function handleRegister() {
    setError(null);
    setLoading(true);

    try {
      const result = await register({ name, email, password, confirmPassword });
      await saveAccessToken(result.accessToken);
      router.replace("/(tabs)/home");
    } catch (caught) {
      setError(getRegisterErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen keyboardAware>
      <Header title="新規登録" backLabel="ホームへ戻る" onBack={() => router.push("/")} />

      <Card>
        <TextField
          autoComplete="name"
          label="名前"
          onChangeText={setName}
          placeholder="中野"
          textContentType="name"
          value={name}
        />
        <TextField
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          label="メールアドレス"
          onChangeText={setEmail}
          placeholder="user@example.com"
          textContentType="emailAddress"
          value={email}
        />
        <TextField
          autoCapitalize="none"
          autoComplete="new-password"
          label="パスワード"
          onChangeText={setPassword}
          placeholder="8文字以上で入力"
          secureTextEntry
          textContentType="newPassword"
          value={password}
        />
        <TextField
          autoCapitalize="none"
          autoComplete="new-password"
          label="パスワード確認"
          onChangeText={setConfirmPassword}
          placeholder="同じパスワードをもう一度入力"
          secureTextEntry
          textContentType="newPassword"
          value={confirmPassword}
        />
        <ErrorMessage message={error ?? googleLogin.error} />
        <Button disabled={googleLogin.loading} loading={loading} loadingLabel="登録中..." onPress={handleRegister}>
          登録する
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
          Googleアカウントで始める
        </Button>
        {googleLogin.unavailableMessage ? (
          <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 19 }}>
            {googleLogin.unavailableMessage}
          </Text>
        ) : null}
      </Card>

      <Pressable onPress={() => router.push("/login")} style={{ alignItems: "center", minHeight: 44, justifyContent: "center" }}>
        <Text style={{ color: colors.primaryDark, fontSize: 14, fontWeight: "800" }}>
          すでにアカウントをお持ちの方はログイン
        </Text>
      </Pressable>
    </Screen>
  );
}
