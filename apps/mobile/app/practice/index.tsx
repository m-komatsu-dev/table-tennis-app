import { useCallback, useState } from "react";
import { Link, router, useFocusEffect } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { fetchPracticeLogs } from "@/api/practice";
import { formatDate } from "@/components/format";
import { Button, Card, EmptyState, ErrorMessage, Header, LoadingState, Row, Screen, colors, styles } from "@/components/ui";
import type { PracticeLog } from "@/types";

export default function PracticeListScreen() {
  const [items, setItems] = useState<PracticeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
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
      <ErrorMessage message={error} />
      {loading ? <LoadingState /> : null}
      {!loading && items.length === 0 ? <EmptyState>まだ練習記録がありません。</EmptyState> : null}
      {items.map((item) => (
        <Card key={item.id}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
            <Text style={{ color: colors.text, flex: 1, fontSize: 17, fontWeight: "800" }}>
              {formatDate(item.practicedAt)}
            </Text>
            <Text style={{ color: colors.primary, fontSize: 15, fontWeight: "800" }}>
              {item.durationMin}分
            </Text>
          </View>
          <Row label="場所" value={item.location} />
          <Row label="内容" value={item.content} />
          <Row label="練習メニュー" value={item.practiceMenu?.title} />
        </Card>
      ))}
      <Button variant="secondary" onPress={() => router.push("/")}>
        ホームへ戻る
      </Button>
    </Screen>
  );
}
