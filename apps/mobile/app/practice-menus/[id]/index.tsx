import { useCallback, useState } from "react";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import type { Href } from "expo-router";
import { Alert, Text, View } from "react-native";
import { deletePracticeMenu, fetchPracticeMenu } from "@/api/practice-menus";
import { practiceMenuCategoryLabels } from "@/components/practice/PracticeMenuForm";
import { Button, Card, ErrorMessage, Header, LoadingState, MetaPill, Row, Screen, SectionTitle, colors } from "@/components/ui";
import type { PracticeMenu } from "@/types";

export default function PracticeMenuDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const menuId = Array.isArray(id) ? id[0] : id;
  const [item, setItem] = useState<PracticeMenu | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!menuId) {
      setError("練習メニューが見つかりません");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchPracticeMenu(menuId);
      setItem(result.practiceMenu);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "練習メニューを取得できませんでした");
    } finally {
      setLoading(false);
    }
  }, [menuId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function confirmDelete() {
    if (!menuId || deleting) {
      return;
    }

    Alert.alert("練習メニューを削除しますか？", "紐づいている練習記録は削除されません。", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          setDeleting(true);
          setError(null);

          try {
            await deletePracticeMenu(menuId);
            router.replace("/practice-menus");
          } catch (caught) {
            setError(caught instanceof Error ? caught.message : "練習メニューを削除できませんでした");
            setDeleting(false);
          }
        }
      }
    ]);
  }

  return (
    <Screen>
      <Header backLabel="一覧へ戻る" onBack={() => router.replace("/practice-menus")} title="練習メニュー詳細" />
      <ErrorMessage actionLabel="再読み込み" message={error} onAction={load} />
      {loading ? <LoadingState /> : null}
      {!loading && item ? (
        <>
          <Card>
            <SectionTitle title={item.title} />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              <MetaPill label={item.totalMinutes ? `${item.totalMinutes}分` : "時間未設定"} tone="green" />
              <MetaPill label={`${item.items.length}項目`} />
            </View>
            <Row label="目的" value={item.goal} />
            <Row label="説明" value={item.description} />
          </Card>

          <Card>
            <SectionTitle title="メニュー項目" />
            <View style={{ gap: 10 }}>
              {item.items.map((menuItem, index) => (
                <View
                  key={menuItem.id}
                  style={{
                    backgroundColor: "#f8fafc",
                    borderColor: colors.border,
                    borderRadius: 8,
                    borderWidth: 1,
                    gap: 6,
                    padding: 12
                  }}
                >
                  <View style={{ alignItems: "flex-start", flexDirection: "row", gap: 10, justifyContent: "space-between" }}>
                    <Text style={{ color: colors.text, flex: 1, fontSize: 15, fontWeight: "900" }}>
                      {index + 1}. {menuItem.title}
                    </Text>
                    <MetaPill label={practiceMenuCategoryLabels[menuItem.category]} tone="blue" />
                  </View>
                  <Text style={{ color: colors.primaryDark, fontSize: 13, fontWeight: "800" }}>
                    {menuItem.durationMin ? `${menuItem.durationMin}分` : "時間未設定"}
                  </Text>
                  {menuItem.description ? (
                    <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 19 }}>{menuItem.description}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          </Card>

          <View style={{ gap: 10 }}>
            <Button onPress={() => router.push(`/practice/new?practiceMenuId=${menuId}`)}>
              このメニューで練習記録を作成
            </Button>
            <Button onPress={() => router.push(`/practice-menus/${menuId}/edit` as Href)} variant="secondary">
              編集
            </Button>
            <Button loading={deleting} loadingLabel="削除中..." onPress={confirmDelete} variant="danger">
              削除
            </Button>
          </View>
        </>
      ) : null}
    </Screen>
  );
}
