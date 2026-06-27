import { useCallback, useState } from "react";
import { Link, router, useFocusEffect } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { fetchPracticeLogs } from "@/api/practice";
import { formatDate } from "@/components/format";
import { Button, Card, EmptyState, ErrorMessage, Header, LoadingState, MetaPill, Row, Screen, colors, styles } from "@/components/ui";
import type { PracticeLog } from "@/types";

export default function PracticeListScreen() {
  const [items, setItems] = useState<PracticeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPracticeLogs();
      setItems(result.practiceLogs);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "練習記録を取得できませんでした");
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
          <Link asChild href="/practice/new">
            <Pressable style={[styles.button, { minHeight: 42 }]}>
              <Text style={styles.buttonText}>追加</Text>
            </Pressable>
          </Link>
        }
        subtitle={`${items.length}件`}
        title="練習記録"
      />
      <ErrorMessage actionLabel="再読み込み" message={error} onAction={load} />
      {loading ? <LoadingState /> : null}
      {!loading && !error && items.length === 0 ? (
        <EmptyState actionLabel="最初の記録を追加" onAction={() => router.push("/practice/new")}>
          まだ練習記録がありません。
        </EmptyState>
      ) : null}
      {!loading && items.map((item) => <PracticeLogCard key={item.id} item={item} />)}
      <Button variant="secondary" onPress={() => router.push("/(tabs)/home")}>
        ホームへ戻る
      </Button>
    </Screen>
  );
}

function PracticeLogCard({ item }: { item: PracticeLog }) {
  return (
    <Pressable onPress={() => router.push(`/practice/${item.id}`)}>
      <Card>
        <View style={{ flexDirection: "row", gap: 10, justifyContent: "space-between" }}>
          <View style={{ flex: 1, gap: 8 }}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: "900", lineHeight: 24 }}>
              {formatDate(item.practicedAt)}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              <MetaPill label={`${item.durationMin}分`} tone="green" />
              <MetaPill label={item.location || "場所未設定"} />
            </View>
          </View>
        </View>
        <Row label="練習メニュー" value={item.practiceMenu?.title} />
        <Row label="内容" value={item.content} />
      </Card>
    </Pressable>
  );
}
