import { useCallback, useEffect, useState } from "react";
import { Link, router, useFocusEffect } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { fetchMe } from "@/api/auth";
import { fetchMatchRecords } from "@/api/match";
import { fetchPracticeLogs } from "@/api/practice";
import { formatDate, formatScores, formatSetCount, resultLabels } from "@/components/format";
import { Button, Card, EmptyState, ErrorMessage, Header, LoadingState, Row, Screen, SectionTitle, colors, styles } from "@/components/ui";
import type { MatchRecord, PracticeLog, User } from "@/types";

export default function AppHomeScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [practices, setPractices] = useState<PracticeLog[]>([]);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
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

  if (loading) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  const latestPractice = practices[0];
  const latestMatch = matches[0];
  const wins = matches.filter((match) => match.result === "WIN").length;
  const winRate = matches.length > 0 ? Math.round((wins / matches.length) * 100) : 0;

  return (
    <Screen>
      <Header
        title={`こんにちは、${user?.name || user?.email || "プレイヤー"}さん`}
        subtitle="今日の記録を積み重ねて、成長を見える化しましょう。"
      />
      <ErrorMessage message={error} />

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
        {latestPractice ? (
          <>
            <Row label="日付" value={formatDate(latestPractice.practicedAt)} />
            <Row label="時間" value={`${latestPractice.durationMin}分`} />
            <Row label="場所" value={latestPractice.location} />
            <Row label="内容" value={latestPractice.content} />
            <Row label="メニュー" value={latestPractice.practiceMenu?.title} />
          </>
        ) : (
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
        {latestMatch ? (
          <>
            <Row label="日付" value={formatDate(latestMatch.playedAt)} />
            <Row label="対戦相手" value={latestMatch.opponentName} />
            <Row label="勝敗" value={resultLabels[latestMatch.result]} />
            <Row label="セットカウント" value={formatSetCount(latestMatch.scores)} />
            <Row label="スコア" value={formatScores(latestMatch.scores)} />
          </>
        ) : (
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
        <Button variant="secondary" onPress={() => router.push("/practice-menus")}>
          練習メニューを見る
        </Button>
        <Button variant="secondary" onPress={() => router.push("/profile")}>
          プロフィールを確認
        </Button>
      </Card>
    </Screen>
  );
}
