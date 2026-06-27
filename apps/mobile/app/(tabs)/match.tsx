import { useCallback, useState } from "react";
import { Link, router, useFocusEffect } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { fetchMatchRecords } from "@/api/match";
import { formatDate, formatScores, formatSetCount, matchTypeLabels, resultLabels } from "@/components/format";
import { Button, Card, EmptyState, ErrorMessage, Header, LoadingState, MetaPill, Row, Screen, colors, styles } from "@/components/ui";
import type { MatchRecord } from "@/types";

export default function MatchListScreen() {
  const [items, setItems] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchMatchRecords();
      setItems(result.matchRecords);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "試合記録を取得できませんでした");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <Screen>
      <Header
        action={
          <Link asChild href="/match/new">
            <Pressable style={[styles.button, { backgroundColor: colors.blue, minHeight: 42 }]}>
              <Text style={styles.buttonText}>追加</Text>
            </Pressable>
          </Link>
        }
        subtitle={`${items.length}件`}
        title="試合記録"
      />
      <ErrorMessage actionLabel="再読み込み" message={error} onAction={load} />
      {loading ? <LoadingState /> : null}
      {!loading && !error && items.length === 0 ? (
        <EmptyState actionLabel="最初の記録を追加" onAction={() => router.push("/match/new")}>
          まだ試合記録がありません。
        </EmptyState>
      ) : null}
      {!loading && items.map((item) => <MatchRecordCard key={item.id} item={item} />)}
      <Button variant="secondary" onPress={() => router.push("/(tabs)/home")}>
        ホームへ戻る
      </Button>
    </Screen>
  );
}

function MatchRecordCard({ item }: { item: MatchRecord }) {
  const resultTone = item.result === "WIN" ? "green" : "red";

  return (
    <Card>
      <View style={{ gap: 8 }}>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: "900", lineHeight: 24 }}>
          {formatDate(item.playedAt)} vs {item.opponentName}
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <MetaPill label={resultLabels[item.result]} tone={resultTone} />
          <MetaPill label={matchTypeLabels[item.matchType]} tone="blue" />
          <MetaPill label={formatSetCount(item.scores)} tone="green" />
        </View>
      </View>
      <Row label="所属チーム" value={item.opponentTeam} />
      <Row label="スコア概要" value={formatScores(item.scores)} />
      <Row label="メモ" value={item.memo} />
    </Card>
  );
}
