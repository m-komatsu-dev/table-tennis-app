import { useState } from "react";
import { router } from "expo-router";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { register } from "@/api/auth";
import { ApiError, apiStatus } from "@/api/client";
import { useGoogleLogin } from "@/auth/google";
import { Button, Card, ErrorMessage, Header, Screen, TextField, colors } from "@/components/ui";
import { saveAccessToken } from "@/storage/token";

const legalConsentRequiredMessage = "利用規約への同意とプライバシーポリシーの確認が必要です。";
const legalBaseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ?? "https://table-tennis-app-rho.vercel.app";

function getRegisterErrorMessage(caught: unknown) {
  if (caught instanceof ApiError) {
    if (caught.status === apiStatus.missingUrl) {
      return "API URLが設定されていません";
    }
    if (caught.status === apiStatus.network) {
      return "サーバーに接続できません";
    }
    if (caught.status === 400) {
      return caught.apiMessage ?? "入力内容を確認してください";
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
  const [legalConsent, setLegalConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const googleLogin = useGoogleLogin({ legalConsent, requireLegalConsent: true });

  async function handleRegister() {
    setError(null);

    if (!legalConsent) {
      setError(legalConsentRequiredMessage);
      return;
    }

    setLoading(true);

    try {
      const result = await register({ name, email, password, confirmPassword, legalConsent });
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
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: legalConsent }}
          onPress={() => setLegalConsent((value) => !value)}
          style={styles.consentRow}
        >
          <View style={[styles.checkbox, legalConsent && styles.checkboxChecked]}>
            {legalConsent ? <Text style={styles.checkmark}>✓</Text> : null}
          </View>
          <Text style={styles.consentText}>
            利用規約に同意し、プライバシーポリシーを確認しました
          </Text>
        </Pressable>
        <View style={styles.legalLinks}>
          <Pressable onPress={() => void Linking.openURL(`${legalBaseUrl}/terms`)}>
            <Text style={styles.legalLinkText}>利用規約</Text>
          </Pressable>
          <Pressable onPress={() => void Linking.openURL(`${legalBaseUrl}/privacy`)}>
            <Text style={styles.legalLinkText}>プライバシーポリシー</Text>
          </Pressable>
        </View>
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

const styles = StyleSheet.create({
  consentRow: {
    alignItems: "flex-start",
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12
  },
  checkbox: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 6,
    borderWidth: 1,
    height: 22,
    justifyContent: "center",
    marginTop: 1,
    width: 22
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  checkmark: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900"
  },
  consentText: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 21
  },
  legalLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14
  },
  legalLinkText: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: "800"
  }
});
