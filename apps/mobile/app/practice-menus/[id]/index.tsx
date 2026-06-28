import { useCallback, useState } from "react";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import type { Href } from "expo-router";
import { Alert, View } from "react-native";
import { deletePracticeMenu, fetchPracticeMenu } from "@/api/practice-menus";
import { practiceMenuCategoryLabels } from "@/components/practice/PracticeMenuForm";
import { Button, Card, ErrorMessage, Header, LoadingState, MetaPill, Row, Screen, SectionTitle } from "@/components/ui";
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
      setItem(null);
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

    Alert.alert("この練習メニューを削除しますか？", "この操作は取り消せません。紐づいている練習記録は削除されません。", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          setDeleting(true);
          setError(null);

          try {
            await deletePracticeMenu(menuId);
            router.replace("/(tabs)/practice-menus" as Href);
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
      <Header backLabel="一覧へ戻る" onBack={() => router.replace("/(tabs)/practice-menus" as Href)} title="練習メニュー詳細" />
      <ErrorMessage actionLabel="再読み込み" message={error} onAction={load} />
      {loading ? <LoadingState /> : null}
      {!loading && item ? (
        <>
          <Card>
            <SectionTitle title={item.title} />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              <MetaPill label={`カテゴリ: ${practiceMenuCategoryLabels[item.items[0]?.category ?? "OTHER"]}`} tone="green" />
            </View>
            <Row label="説明" value={item.description ?? item.goal ?? item.items[0]?.description} />
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
