import { useCallback, useState } from "react";
import { Link, router, useFocusEffect } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { fetchMatchRecords } from "@/api/match";
import { formatDate, formatScores, formatSetCount, matchTypeLabels, resultLabels } from "@/components/format";
import { Button, Card, EmptyState, ErrorMessage, Header, LoadingState, Row, Screen, colors, styles } from "@/components/ui";
import type { MatchRecord } from "@/types";

export default function MatchListScreen() {
  const [items, setItems] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
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
      <ErrorMessage message={error} />
      {loading ? <LoadingState /> : null}
      {!loading && items.length === 0 ? <EmptyState>まだ試合記録がありません。</EmptyState> : null}
      {items.map((item) => (
        <Card key={item.id}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
            <Text style={{ color: colors.text, flex: 1, fontSize: 17, fontWeight: "800" }}>
              {formatDate(item.playedAt)} vs {item.opponentName}
            </Text>
            <Text style={{ color: item.result === "WIN" ? colors.primary : colors.danger, fontSize: 15, fontWeight: "800" }}>
              {resultLabels[item.result]}
            </Text>
          </View>
          <Row label="相手所属チーム" value={item.opponentTeam} />
          <Row label="試合種別" value={matchTypeLabels[item.matchType]} />
          <Row label="セットカウント" value={formatSetCount(item.scores)} />
          <Row label="スコア概要" value={formatScores(item.scores)} />
          <Row label="メモ" value={item.memo} />
        </Card>
      ))}
      <Button variant="secondary" onPress={() => router.push("/(tabs)/home")}>
        ホームへ戻る
      </Button>
    </Screen>
  );
}
