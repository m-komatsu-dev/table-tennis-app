import { useCallback, useEffect, useState } from "react";
import { Link, router, useFocusEffect } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { fetchMe } from "@/api/auth";
import { fetchMatchRecords } from "@/api/match";
import { fetchPracticeLogs } from "@/api/practice";
import { formatDate, formatScores, formatSetCount, resultLabels } from "@/components/format";
import { Button, Card, EmptyState, ErrorMessage, Header, LoadingState, Row, Screen, SectionTitle, colors, styles } from "@/components/ui";
import type { MatchRecord, PracticeLog, User } from "@/types";

export default function HomeScreen() {
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
      if (caught instanceof Error) {
        setError(caught.message);
      }
      router.replace("/login");
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

  return (
    <Screen>
      <Header title="ホーム" subtitle={user ? `${user.name || user.email} さん` : undefined} />
      <ErrorMessage message={error} />

      <View style={{ flexDirection: "row", gap: 10 }}>
        <Link asChild href="/practice/new">
          <Pressable style={[styles.button, { flex: 1 }]}>
            <Text style={styles.buttonText}>練習記録</Text>
          </Pressable>
        </Link>
        <Link asChild href="/match/new">
          <Pressable style={[styles.button, { backgroundColor: colors.blue, flex: 1 }]}>
            <Text style={styles.buttonText}>試合記録</Text>
          </Pressable>
        </Link>
      </View>

      <Card>
        <SectionTitle title="直近の練習" />
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
        <SectionTitle title="直近の試合" />
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
        <SectionTitle title="メニュー" />
        <Button variant="secondary" onPress={() => router.push("/practice-menus")}>
          練習メニュー一覧
        </Button>
        <Button variant="secondary" onPress={() => router.push("/profile")}>
          プロフィール
        </Button>
      </Card>
    </Screen>
  );
}
