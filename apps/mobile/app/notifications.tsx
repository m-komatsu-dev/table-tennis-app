import { useCallback, useMemo, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import type { Href } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { fetchMatchRecords } from "@/api/match";
import { fetchNotifications, markAllNotificationsRead as markAllServerNotificationsRead, markNotificationRead as markServerNotificationRead } from "@/api/notifications";
import { fetchPracticeLogs } from "@/api/practice";
import { fetchPracticeMenus } from "@/api/practice-menus";
import { NotificationCard } from "@/components/NotificationCard";
import { Button, Card, EmptyState, ErrorMessage, Header, LoadingState, Screen, SectionTitle, colors, styles } from "@/components/ui";
import {
  getNotificationSettings,
  getNotificationState,
  hideNotification,
  markAllNotificationsAsRead as markAllLocalNotificationsAsRead,
  markNotificationAsRead as markLocalNotificationAsRead,
  saveNotificationSettings,
  type NotificationState
} from "@/storage/notificationStorage";
import type { AppNotification, MatchRecord, PracticeLog, PracticeMenu } from "@/types";
import {
  defaultNotificationSettings,
  generateInAppNotifications,
  getUnreadNotificationCount,
  type InAppNotification,
  type NotificationSettings
} from "@/utils/notifications";

type DisplayNotification = {
  key: string;
  source: "local" | "server";
  local?: InAppNotification;
  server?: AppNotification;
  title: string;
  description: string;
  meta: string;
  actionLabel: string;
  read: boolean;
};

export default function NotificationsScreen() {
  const [practices, setPractices] = useState<PracticeLog[]>([]);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [menus, setMenus] = useState<PracticeMenu[]>([]);
  const [serverNotifications, setServerNotifications] = useState<AppNotification[]>([]);
  const [state, setState] = useState<NotificationState>({ readIds: [], hiddenIds: [] });
  const [settings, setSettings] = useState<NotificationSettings>(defaultNotificationSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [practiceResult, matchResult, menuResult, serverNotificationResult, storedState, storedSettings] = await Promise.all([
        fetchPracticeLogs(),
        fetchMatchRecords(),
        fetchPracticeMenus(),
        fetchNotifications(),
        getNotificationState(),
        getNotificationSettings()
      ]);

      setPractices(practiceResult.practiceLogs);
      setMatches(matchResult.matchRecords);
      setMenus(menuResult.practiceMenus);
      setServerNotifications(serverNotificationResult.notifications);
      setState(storedState);
      setSettings(storedSettings);
    } catch {
      setError("通信状況を確認して、もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const allNotifications = useMemo(
    () => generateInAppNotifications({ practiceLogs: practices, matchRecords: matches, practiceMenus: menus, settings }),
    [matches, menus, practices, settings]
  );
  const visibleNotifications = useMemo<DisplayNotification[]>(
    () => [
      ...serverNotifications.map((notification) => ({
        key: `server-${notification.id}`,
        source: "server" as const,
        server: notification,
        title: notification.title,
        description: notification.body,
        meta: labelForServerNotification(notification.type),
        actionLabel: notification.chatRoomId ? "チャットを開く" : "開く",
        read: notification.isRead
      })),
      ...allNotifications
        .filter((notification) => !state.hiddenIds.includes(notification.id))
        .map((notification) => ({
          key: `local-${notification.id}`,
          source: "local" as const,
          local: notification,
          title: notification.title,
          description: notification.description,
          meta: notification.meta,
          actionLabel: notification.actionLabel,
          read: state.readIds.includes(notification.id)
        }))
    ],
    [allNotifications, serverNotifications, state.hiddenIds, state.readIds]
  );
  const unreadCount =
    getUnreadNotificationCount(allNotifications, state.readIds, state.hiddenIds) +
    serverNotifications.filter((notification) => !notification.isRead).length;

  const handleMarkRead = useCallback(async (notification: DisplayNotification) => {
    if (notification.source === "server" && notification.server) {
      const result = await markServerNotificationRead(notification.server.id);
      setServerNotifications((items) => items.map((item) => (item.id === result.notification.id ? result.notification : item)));
      return;
    }

    if (notification.local) {
      setState(await markLocalNotificationAsRead(notification.local.id));
    }
  }, []);

  const handleHide = useCallback(async (notification: DisplayNotification) => {
    if (notification.local) {
      setState(await hideNotification(notification.local.id));
    }
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    const localIds = visibleNotifications
      .filter((notification) => notification.source === "local" && notification.local)
      .map((notification) => notification.local?.id)
      .filter((id): id is InAppNotification["id"] => Boolean(id));

    const [nextState] = await Promise.all([
      markAllLocalNotificationsAsRead(localIds),
      markAllServerNotificationsRead()
    ]);

    setState(nextState);
    setServerNotifications((items) => items.map((item) => ({ ...item, isRead: true, readAt: item.readAt ?? new Date().toISOString() })));
  }, [visibleNotifications]);

  const handleAction = useCallback(async (notification: DisplayNotification) => {
    if (notification.source === "server" && notification.server) {
      const result = await markServerNotificationRead(notification.server.id);
      setServerNotifications((items) => items.map((item) => (item.id === result.notification.id ? result.notification : item)));

      if (notification.server.chatRoomId) {
        router.push(`/chat/${notification.server.chatRoomId}` as Href);
        return;
      }

      setError("この通知に関連するチャットは利用できません。");
      return;
    }

    if (!notification.local) {
      return;
    }

    setState(await markLocalNotificationAsRead(notification.local.id));

    if (notification.local.actionTarget === "new-practice") {
      router.push("/practice/new");
      return;
    }

    if (notification.local.actionTarget === "analytics") {
      router.push("/analytics");
      return;
    }

    if (notification.local.actionTarget === "matches") {
      router.push("/match");
      return;
    }

    if (notification.local.actionTarget === "ai-coach") {
      router.push("/ai-coach");
      return;
    }

    router.push("/practice-menus/new");
  }, []);

  const updateSetting = useCallback(
    async (key: keyof NotificationSettings, value: boolean) => {
      const nextSettings = { ...settings, [key]: value };

      setSettings(nextSettings);
      await saveNotificationSettings(nextSettings);
    },
    [settings]
  );

  return (
    <Screen>
      <Header
        action={
          visibleNotifications.length > 0 ? (
            <Pressable onPress={handleMarkAllRead} style={styles.listAddButton}>
              <Text style={styles.buttonText}>すべて既読</Text>
            </Pressable>
          ) : null
        }
        backLabel="ホーム"
        onBack={() => router.push("/(tabs)/home")}
        subtitle={unreadCount > 0 ? `未読 ${unreadCount}件` : "新しい未読はありません"}
        title="お知らせ"
      />
      <ErrorMessage
        actionLabel="再読み込み"
        message={error}
        onAction={load}
        title={error ? "お知らせを読み込めませんでした。" : undefined}
      />
      {loading ? <LoadingState /> : null}
      {!loading && !error && visibleNotifications.length === 0 ? (
        <EmptyState>
          現在、新しいお知らせはありません。{"\n\n"}練習や試合を記録すると、振り返りやリマインダーが表示されます。
        </EmptyState>
      ) : null}
      {!loading && !error && visibleNotifications.length > 0 ? (
        <View style={{ gap: 12 }}>
          {visibleNotifications.map((notification) => (
            <NotificationCard
              key={notification.key}
              item={notification}
              onAction={() => handleAction(notification)}
              onHide={notification.source === "local" ? () => handleHide(notification) : undefined}
              onMarkRead={() => handleMarkRead(notification)}
              read={notification.read}
            />
          ))}
        </View>
      ) : null}
      <NotificationSettingsCard settings={settings} onChange={updateSetting} />
      <Button variant="secondary" onPress={() => router.push("/(tabs)/home")}>
        ホームへ戻る
      </Button>
    </Screen>
  );
}

function labelForServerNotification(type: AppNotification["type"]) {
  if (type === "CHAT_MESSAGE") {
    return "チャット";
  }

  if (type === "PARTNER_REQUEST_ACCEPTED" || type === "PARTNER_REQUEST_RECEIVED") {
    return "マッチング";
  }

  return "お知らせ";
}

function NotificationSettingsCard({
  settings,
  onChange
}: {
  settings: NotificationSettings;
  onChange: (key: keyof NotificationSettings, value: boolean) => void;
}) {
  return (
    <Card>
      <SectionTitle title="通知設定" subtitle="端末内に保存されます。Push通知は使用しません。" />
      <SettingRow
        enabled={settings.showPracticeReminder}
        label="練習リマインダーを表示する"
        onPress={() => onChange("showPracticeReminder", !settings.showPracticeReminder)}
      />
      <SettingRow
        enabled={settings.showWeeklySummary}
        label="週次まとめを表示する"
        onPress={() => onChange("showWeeklySummary", !settings.showWeeklySummary)}
      />
      <SettingRow
        enabled={settings.showAiCoachSuggestion}
        label="AIコーチ案内を表示する"
        onPress={() => onChange("showAiCoachSuggestion", !settings.showAiCoachSuggestion)}
      />
    </Card>
  );
}

function SettingRow({ enabled, label, onPress }: { enabled: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        alignItems: "center",
        backgroundColor: enabled ? "#ecfdf5" : "#f8fafc",
        borderColor: enabled ? "#a7f3d0" : colors.border,
        borderRadius: 8,
        borderWidth: 1,
        flexDirection: "row",
        gap: 12,
        justifyContent: "space-between",
        minHeight: 52,
        paddingHorizontal: 12
      }}
    >
      <Text style={{ color: colors.text, flex: 1, fontSize: 14, fontWeight: "800", lineHeight: 20 }}>{label}</Text>
      <View
        style={{
          alignItems: enabled ? "flex-end" : "flex-start",
          backgroundColor: enabled ? colors.primary : colors.faint,
          borderRadius: 999,
          height: 28,
          justifyContent: "center",
          padding: 3,
          width: 50
        }}
      >
        <View style={{ backgroundColor: "#ffffff", borderRadius: 999, height: 22, width: 22 }} />
      </View>
    </Pressable>
  );
}
