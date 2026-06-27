import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { Text, View } from "react-native";
import { fetchPracticeMenus } from "@/api/practice-menus";
import { Button, Card, EmptyState, ErrorMessage, Header, LoadingState, MetaPill, Row, Screen, colors } from "@/components/ui";
import type { PracticeMenu } from "@/types";

export default function PracticeMenusScreen() {
  const [items, setItems] = useState<PracticeMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPracticeMenus();
      setItems(result.practiceMenus);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "練習メニューを取得できませんでした");
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
      <Header subtitle={`${items.length}件`} title="練習メニュー" />
      <ErrorMessage actionLabel="再読み込み" message={error} onAction={load} />
      {loading ? <LoadingState /> : null}
      {!loading && !error && items.length === 0 ? <EmptyState>まだ練習メニューがありません。</EmptyState> : null}
      {!loading && items.map((item) => <PracticeMenuCard key={item.id} item={item} />)}
      <Button variant="secondary" onPress={() => router.push("/(tabs)/home")}>
        ホームへ戻る
      </Button>
    </Screen>
  );
}

function PracticeMenuCard({ item }: { item: PracticeMenu }) {
  const visibleItems = item.items.slice(0, 3);

  return (
    <Card>
      <View style={{ gap: 8 }}>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: "900", lineHeight: 24 }}>
          {item.title}
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <MetaPill label={item.totalMinutes ? `${item.totalMinutes}分` : "時間未設定"} tone="green" />
          <MetaPill label={`${item.items.length}項目`} />
        </View>
      </View>
      <Row label="目的" value={item.goal || item.description} />
      {visibleItems.length > 0 ? (
        <View style={{ gap: 8 }}>
          <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "800" }}>メニュー項目</Text>
          <View style={{ gap: 6 }}>
            {visibleItems.map((menuItem) => (
              <View
                key={menuItem.id}
                style={{
                  backgroundColor: "#f8fafc",
                  borderColor: colors.border,
                  borderRadius: 8,
                  borderWidth: 1,
                  padding: 10
                }}
              >
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: "800" }}>{menuItem.title}</Text>
                <Text style={{ color: colors.muted, fontSize: 12, marginTop: 3 }}>
                  {menuItem.durationMin ? `${menuItem.durationMin}分` : "時間未設定"}
                </Text>
              </View>
            ))}
          </View>
          {item.items.length > visibleItems.length ? (
            <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "700" }}>
              ほか{item.items.length - visibleItems.length}項目
            </Text>
          ) : null}
        </View>
      ) : (
        <EmptyState>メニュー項目はまだありません。</EmptyState>
      )}
    </Card>
  );
}
