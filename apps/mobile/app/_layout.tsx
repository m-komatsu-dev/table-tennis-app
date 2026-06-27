import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { colors } from "@/components/ui";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: "800" }
        }}
      >
        <Stack.Screen name="login" options={{ title: "ログイン", headerShown: false }} />
        <Stack.Screen name="index" options={{ title: "ホーム" }} />
        <Stack.Screen name="practice/index" options={{ title: "練習記録" }} />
        <Stack.Screen name="practice/new" options={{ title: "練習を記録" }} />
        <Stack.Screen name="match/index" options={{ title: "試合記録" }} />
        <Stack.Screen name="match/new" options={{ title: "試合を記録" }} />
        <Stack.Screen name="practice-menus/index" options={{ title: "練習メニュー" }} />
        <Stack.Screen name="profile" options={{ title: "プロフィール" }} />
      </Stack>
    </SafeAreaProvider>
  );
}
