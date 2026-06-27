import { useEffect, useState } from "react";
import { Redirect, Tabs } from "expo-router";
import { fetchMe } from "@/api/auth";
import { LoadingState, Screen, colors } from "@/components/ui";
import { getAccessToken } from "@/storage/token";

export default function TabsLayout() {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const token = await getAccessToken();

      if (!token) {
        if (mounted) {
          setAuthenticated(false);
          setChecking(false);
        }
        return;
      }

      try {
        await fetchMe();
        if (mounted) {
          setAuthenticated(true);
        }
      } catch {
        if (mounted) {
          setAuthenticated(false);
        }
      } finally {
        if (mounted) {
          setChecking(false);
        }
      }
    }

    checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  if (checking) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  if (!authenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          minHeight: 62,
          paddingBottom: 8,
          paddingTop: 6
        }
      }}
    >
      <Tabs.Screen name="home" options={{ title: "ホーム" }} />
      <Tabs.Screen name="practice" options={{ title: "練習" }} />
      <Tabs.Screen name="match" options={{ title: "試合" }} />
      <Tabs.Screen name="analytics" options={{ title: "分析" }} />
      <Tabs.Screen name="calendar" options={{ title: "カレンダー" }} />
      <Tabs.Screen name="practice-menus" options={{ title: "メニュー" }} />
      <Tabs.Screen name="profile" options={{ title: "プロフィール" }} />
    </Tabs>
  );
}
