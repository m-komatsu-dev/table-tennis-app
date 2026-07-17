import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, router, useFocusEffect } from "expo-router";
import type { Href } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { fetchMe } from "@/api/auth";
import { fetchChatRooms } from "@/api/chat";
import { fetchMatchRecords } from "@/api/match";
import { fetchPracticeLogs } from "@/api/practice";
import { fetchPracticeMenus } from "@/api/practice-menus";
import { formatDate, formatScores, formatSetCount, resultLabels } from "@/components/format";
import { Button, Card, EmptyState, ErrorMessage, Header, LoadingState, MetaPill, Row, Screen, SectionTitle, colors, styles } from "@/components/ui";
import { getNotificationSettings, getNotificationState, type NotificationState } from "@/storage/notificationStorage";
import type { MatchRecord, PracticeLog, PracticeMenu, User } from "@/types";
import { defaultNotificationSettings, generateInAppNotifications, getUnreadNotificationCount, type NotificationSettings } from "@/utils/notifications";

export default function AppHomeScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [practices, setPractices] = useState<PracticeLog[]>([]);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [menus, setMenus] = useState<PracticeMenu[]>([]);
  const [notificationState, setNotificationState] = useState<NotificationState>({ readIds: [], hiddenIds: [] });
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(defaultNotificationSettings);
  const [notificationPreviewReady, setNotificationPreviewReady] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [me, practiceResult, matchResult] = await Promise.all([
        fetchMe(),
        fetchPracticeLogs(),
        fetchMatchRecords()
      ]);
      setUser(me.user);
      setPractices(practiceResult.practiceLogs);
      setMatches(matchResult.matchRecords);

      try {
        const [menuResult, storedNotificationState, storedNotificationSettings] = await Promise.all([
          fetchPracticeMenus(),
          getNotificationState(),
          getNotificationSettings()
        ]);
        setMenus(menuResult.practiceMenus);
        setNotificationState(storedNotificationState);
        setNotificationSettings(storedNotificationSettings);
        setNotificationPreviewReady(true);
      } catch {
        setMenus([]);
        setNotificationState({ readIds: [], hiddenIds: [] });
        setNotificationSettings(defaultNotificationSettings);
        setNotificationPreviewReady(false);
      }

      try {
        const chatResult = await fetchChatRooms();
        setUnreadChatCount(chatResult.chatRooms.filter((room) => room.unreadCount > 0).length);
      } catch {
        setUnreadChatCount(0);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "ホーム情報を取得できませんでした");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const notifications = useMemo(
    () => generateInAppNotifications({ practiceLogs: practices, matchRecords: matches, practiceMenus: menus, settings: notificationSettings }),
    [matches, menus, notificationSettings, practices]
  );
  const unreadNotificationCount = notificationPreviewReady
    ? getUnreadNotificationCount(notifications, notificationState.readIds, notificationState.hiddenIds)
    : 0;
  const latestPractice = practices[0];
  const latestMatch = matches[0];
  const wins = matches.filter((match) => match.result === "WIN").length;
  const winRate = matches.length > 0 ? Math.round((wins / matches.length) * 100) : 0;

  if (loading) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header
        title={`こんにちは、${user?.name || user?.email || "プレイヤー"}さん`}
        subtitle="今日の記録を積み重ねて、成長を見える化しましょう。"
      />
      <ErrorMessage actionLabel="再読み込み" message={error} onAction={load} />

      {unreadChatCount > 0 ? (
        <Card>
          <SectionTitle title={`未読チャットが${unreadChatCount}件あります`} subtitle="チャット一覧で新しいメッセージを確認できます。" />
          <Button variant="secondary" onPress={() => router.push("/chat" as Href)}>
            チャットを見る
          </Button>
        </Card>
      ) : null}

      {unreadNotificationCount > 0 ? (
        <Card>
          <SectionTitle title={`お知らせ ${unreadNotificationCount}件`} subtitle="練習や試合の振り返りにつながる案内があります。" />
          <Button variant="secondary" onPress={() => router.push("/notifications")}>
            お知らせを見る
          </Button>
        </Card>
      ) : null}

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {[
          ["練習記録", practices.length],
          ["試合記録", matches.length],
          ["勝利数", wins],
          ["勝率", `${winRate}%`]
        ].map(([label, value]) => (
          <View
            key={label}
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: 8,
              borderWidth: 1,
              flexBasis: "47%",
              flexGrow: 1,
              gap: 6,
              padding: 14
            }}
          >
            <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "700" }}>{label}</Text>
            <Text style={{ color: colors.text, fontSize: 24, fontWeight: "800" }}>{value}</Text>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <Link asChild href="/practice/new">
          <Pressable style={[styles.button, { flex: 1 }]}>
            <Text style={styles.buttonText}>練習を記録</Text>
          </Pressable>
        </Link>
        <Link asChild href="/match/new">
          <Pressable style={[styles.button, { backgroundColor: colors.blue, flex: 1 }]}>
            <Text style={styles.buttonText}>試合を記録</Text>
          </Pressable>
        </Link>
      </View>

      <Card>
        <SectionTitle title="直近の練習記録" />
        {latestPractice ? <LatestPractice item={latestPractice} /> : (
          <EmptyState>まだ練習記録がありません。</EmptyState>
        )}
        <Link asChild href="/practice">
          <Pressable>
            <Text style={{ color: colors.primary, fontWeight: "800" }}>練習記録一覧を見る</Text>
          </Pressable>
        </Link>
      </Card>

      <Card>
        <SectionTitle title="直近の試合記録" />
        {latestMatch ? <LatestMatch item={latestMatch} /> : (
          <EmptyState>まだ試合記録がありません。</EmptyState>
        )}
        <Link asChild href="/match">
          <Pressable>
            <Text style={{ color: colors.primary, fontWeight: "800" }}>試合記録一覧を見る</Text>
          </Pressable>
        </Link>
      </Card>

      <Card>
        <SectionTitle title="次にできること" />
        <Button variant="secondary" onPress={() => router.push("/ai-coach")}>
          AIコーチを見る
        </Button>
        <Button variant="secondary" onPress={() => router.push("/analytics")}>
          分析を見る
        </Button>
        <Button variant="secondary" onPress={() => router.push("/calendar")}>
          カレンダーを見る
        </Button>
        <Button variant="secondary" onPress={() => router.push("/practice-menus")}>
          練習メニューを見る
        </Button>
        <Button variant="secondary" onPress={() => router.push("/partner-posts" as Href)}>
          募集を見る
        </Button>
        <Button variant="secondary" onPress={() => router.push("/chat" as Href)}>
          チャット
        </Button>
        <Button variant="secondary" onPress={() => router.push("/feedback" as Href)}>
          フィードバック
        </Button>
        <Button variant="secondary" onPress={() => router.push("/profile")}>
          プロフィールを確認
        </Button>
      </Card>
    </Screen>
  );
}

function LatestPractice({ item }: { item: PracticeLog }) {
  return (
    <View style={{ gap: 12 }}>
      <View style={{ gap: 8 }}>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: "900", lineHeight: 24 }}>
          {formatDate(item.practicedAt)}
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <MetaPill label={`${item.durationMin}分`} tone="green" />
          <MetaPill label={item.location || "場所未設定"} />
        </View>
      </View>
      <Row label="練習メニュー" value={item.practiceMenu?.title} />
      <Row label="内容" value={item.content} />
    </View>
  );
}

function LatestMatch({ item }: { item: MatchRecord }) {
  return (
    <View style={{ gap: 12 }}>
      <View style={{ gap: 8 }}>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: "900", lineHeight: 24 }}>
          {formatDate(item.playedAt)} vs {item.opponentName}
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <MetaPill label={resultLabels[item.result]} tone={item.result === "WIN" ? "green" : "red"} />
          <MetaPill label={formatSetCount(item.scores)} tone="green" />
        </View>
      </View>
      <Row label="所属チーム" value={item.opponentTeam} />
      <Row label="スコア概要" value={formatScores(item.scores)} />
    </View>
  );
}
