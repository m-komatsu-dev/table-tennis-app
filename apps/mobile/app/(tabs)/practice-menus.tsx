import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { Text, View } from "react-native";
import { fetchPracticeMenus } from "@/api/practice-menus";
import { Button, Card, EmptyState, ErrorMessage, Header, LoadingState, Row, Screen, colors } from "@/components/ui";
import type { PracticeMenu } from "@/types";

export default function PracticeMenusScreen() {
  const [items, setItems] = useState<PracticeMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
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
      <ErrorMessage message={error} />
      {loading ? <LoadingState /> : null}
      {!loading && items.length === 0 ? <EmptyState>まだ練習メニューがありません。</EmptyState> : null}
      {items.map((item) => (
        <Card key={item.id}>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800" }}>{item.title}</Text>
          <Row label="目的" value={item.goal || item.description} />
          <Row label="合計時間" value={item.totalMinutes ? `${item.totalMinutes}分` : null} />
          <View style={{ gap: 8 }}>
            <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "800" }}>メニュー項目</Text>
            {item.items.length === 0 ? (
              <Text style={{ color: colors.faint }}>項目はありません</Text>
            ) : (
              item.items.map((menuItem) => (
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
                  {menuItem.description ? (
                    <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 5 }}>
                      {menuItem.description}
                    </Text>
                  ) : null}
                </View>
              ))
            )}
          </View>
        </Card>
      ))}
      <Button variant="secondary" onPress={() => router.push("/(tabs)/home")}>
        ホームへ戻る
      </Button>
    </Screen>
  );
}
