import { useEffect, useState } from "react";
import { router } from "expo-router";
import { Text, View } from "react-native";
import { fetchMe, login } from "@/api/auth";
import { Button, Card, ErrorMessage, Screen, TextField, colors, styles } from "@/components/ui";
import { getAccessToken, saveAccessToken } from "@/storage/token";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
          router.replace("/");
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
      router.replace("/");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "ログインに失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
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
          placeholder="password"
          secureTextEntry
          value={password}
        />
        <ErrorMessage message={error} />
        <Button loading={loading} onPress={handleLogin}>
          ログイン
        </Button>
      </Card>
    </Screen>
  );
}
