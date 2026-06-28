import type { ComponentProps } from "react";
import { useEffect, useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Redirect, Tabs } from "expo-router";
import { fetchMe } from "@/api/auth";
import { LoadingState, Screen, colors } from "@/components/ui";
import { getAccessToken } from "@/storage/token";

type TabName = "home" | "practice" | "match" | "analytics" | "calendar" | "practice-menus" | "profile";
type TabIconName = ComponentProps<typeof Ionicons>["name"];

const tabIcons: Record<TabName, TabIconName> = {
  home: "home-outline",
  practice: "fitness-outline",
  match: "trophy-outline",
  analytics: "bar-chart-outline",
  calendar: "calendar-outline",
  "practice-menus": "clipboard-outline",
  profile: "person-outline"
};

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
        tabBarItemStyle: {
          minHeight: 54,
          paddingVertical: 4
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "700" },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          minHeight: 62,
          paddingBottom: 8,
          paddingTop: 6
        }
      }}
    >
      <Tabs.Screen name="home" options={tabOptions("home", "ホーム")} />
      <Tabs.Screen name="practice" options={tabOptions("practice", "練習")} />
      <Tabs.Screen name="match" options={tabOptions("match", "試合")} />
      <Tabs.Screen name="analytics" options={tabOptions("analytics", "分析")} />
      <Tabs.Screen name="calendar" options={tabOptions("calendar", "予定")} />
      <Tabs.Screen name="practice-menus" options={tabOptions("practice-menus", "メニュー")} />
      <Tabs.Screen name="profile" options={tabOptions("profile", "自分")} />
    </Tabs>
  );
}

function tabOptions(name: TabName, title: string) {
  return {
    tabBarIcon: ({ color, focused, size }: { color: string; focused: boolean; size: number }) => (
      <TabIcon color={color} focused={focused} name={name} size={size} />
    ),
    title
  };
}

function TabIcon({ color, focused, name, size }: { color: string; focused: boolean; name: TabName; size: number }) {
  return <Ionicons color={color} name={tabIcons[name]} size={focused ? size + 1 : size} />;
}
