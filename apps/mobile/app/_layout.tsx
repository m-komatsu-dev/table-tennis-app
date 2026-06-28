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
        <Stack.Screen name="register" options={{ title: "新規登録", headerShown: false }} />
        <Stack.Screen name="index" options={{ title: "卓球記録", headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="ai-coach" options={{ title: "AIコーチ", headerShown: false }} />
        <Stack.Screen name="profile/edit" options={{ title: "プロフィール編集", headerShown: false }} />
        <Stack.Screen name="practice/new" options={{ title: "練習を記録", headerShown: false }} />
        <Stack.Screen name="practice/[id]/index" options={{ title: "練習記録詳細", headerShown: false }} />
        <Stack.Screen name="practice/[id]/edit/index" options={{ title: "練習記録を編集", headerShown: false }} />
        <Stack.Screen name="practice-menus/new" options={{ title: "練習メニューを作成", headerShown: false }} />
        <Stack.Screen name="practice-menus/[id]/index" options={{ title: "練習メニュー詳細", headerShown: false }} />
        <Stack.Screen name="practice-menus/[id]/edit/index" options={{ title: "練習メニューを編集", headerShown: false }} />
        <Stack.Screen name="match/new" options={{ title: "試合を記録", headerShown: false }} />
        <Stack.Screen name="match/[id]/index" options={{ title: "試合記録詳細", headerShown: false }} />
        <Stack.Screen name="match/[id]/edit/index" options={{ title: "試合記録を編集", headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
