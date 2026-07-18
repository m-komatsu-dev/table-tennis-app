import { useEffect, useMemo, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import {
  completeGoogleBrowserLoginFromParams,
  getGoogleErrorMessage
} from "@/auth/google";
import { Card, ErrorMessage, Screen, colors, styles } from "@/components/ui";

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams();
  const [error, setError] = useState<string | null>(null);
  const callbackKey = useMemo(() => JSON.stringify(params), [params]);

  useEffect(() => {
    let mounted = true;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    async function finishLogin() {
      try {
        await completeGoogleBrowserLoginFromParams(params);
        if (mounted) {
          router.replace("/(tabs)/home");
        }
      } catch (caught) {
        if (!mounted) {
          return;
        }

        setError(getGoogleErrorMessage(caught));
        timeout = setTimeout(() => {
          router.replace("/login");
        }, 1400);
      }
    }

    finishLogin();

    return () => {
      mounted = false;
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [callbackKey, params]);

  return (
    <Screen>
      <Card>
        <View style={{ gap: 8 }}>
          <Text style={[styles.title, { fontSize: 24 }]}>Googleログイン</Text>
          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21 }}>
            ログイン情報を確認しています…
          </Text>
          <ErrorMessage message={error} />
        </View>
      </Card>
    </Screen>
  );
}
