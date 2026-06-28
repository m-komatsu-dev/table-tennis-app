import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import type { Href } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { fetchPracticeMenus } from "@/api/practice-menus";
import { Button, Card, EmptyState, ErrorMessage, Header, LoadingState, MetaPill, Row, Screen, colors, styles } from "@/components/ui";
import { practiceMenuCategoryLabels } from "@/components/practice/PracticeMenuForm";
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

  const goToNewMenu = useCallback(() => {
    router.push("/practice-menus/new" as Href);
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
          <Pressable onPress={goToNewMenu} style={styles.listAddButton}>
            <Text style={styles.buttonText}>作成</Text>
          </Pressable>
        }
        subtitle={`${items.length}件`}
        title="練習メニュー"
      />
      <ErrorMessage actionLabel="再読み込み" message={error} onAction={load} />
      {loading ? <LoadingState /> : null}
      {!loading && !error && items.length === 0 ? (
        <EmptyState actionLabel="練習メニューを作成" onAction={goToNewMenu}>
          まだ練習メニューがありません。{"\n"}よく使う練習をメニュー化して、記録時に選べるようにしましょう。
        </EmptyState>
      ) : null}
      {!loading && items.map((item) => <PracticeMenuCard key={item.id} item={item} />)}
      <Button variant="secondary" onPress={() => router.push("/(tabs)/home")}>
        ホームへ戻る
      </Button>
    </Screen>
  );
}

function PracticeMenuCard({ item }: { item: PracticeMenu }) {
  const category = item.items[0]?.category ?? "OTHER";
  const description = item.description ?? item.goal ?? item.items[0]?.description ?? null;

  return (
    <Pressable onPress={() => router.push(`/practice-menus/${item.id}` as Href)}>
      <Card>
        <View style={{ gap: 8 }}>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: "900", lineHeight: 24 }}>
            {item.title}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <MetaPill label={`カテゴリ: ${practiceMenuCategoryLabels[category]}`} tone="green" />
          </View>
        </View>
        <Row label="説明" value={description} />
      </Card>
    </Pressable>
  );
}
