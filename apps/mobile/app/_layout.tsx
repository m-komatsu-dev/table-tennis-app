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
        <Stack.Screen name="index" options={{ title: "卓球記録", headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="practice/new" options={{ title: "練習を記録" }} />
        <Stack.Screen name="match/new" options={{ title: "試合を記録" }} />
      </Stack>
    </SafeAreaProvider>
  );
}
