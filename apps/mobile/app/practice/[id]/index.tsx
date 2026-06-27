import { useCallback, useState } from "react";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Alert, View } from "react-native";
import { deletePracticeLog, fetchPracticeLog } from "@/api/practice";
import { formatDate } from "@/components/format";
import { Button, Card, ErrorMessage, Header, LoadingState, MetaPill, Row, Screen, SectionTitle } from "@/components/ui";
import type { PracticeLog } from "@/types";

export default function PracticeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const practiceId = Array.isArray(id) ? id[0] : id;
  const [item, setItem] = useState<PracticeLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!practiceId) {
      setError("練習記録が見つかりません");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchPracticeLog(practiceId);
      setItem(result.practiceLog);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "練習記録を取得できませんでした");
    } finally {
      setLoading(false);
    }
  }, [practiceId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function confirmDelete() {
    if (!practiceId || deleting) {
      return;
    }

    Alert.alert("練習記録を削除しますか？", "削除すると元に戻せません。", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          setDeleting(true);
          setError(null);

          try {
            await deletePracticeLog(practiceId);
            router.replace("/practice");
          } catch (caught) {
            setError(caught instanceof Error ? caught.message : "練習記録を削除できませんでした");
            setDeleting(false);
          }
        }
      }
    ]);
  }

  return (
    <Screen>
      <Header backLabel="一覧へ戻る" onBack={() => router.replace("/practice")} title="練習記録詳細" />
      <ErrorMessage actionLabel="再読み込み" message={error} onAction={load} />
      {loading ? <LoadingState /> : null}
      {!loading && item ? (
        <>
          <Card>
            <SectionTitle title={formatDate(item.practicedAt)} />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              <MetaPill label={`${item.durationMin}分`} tone="green" />
              <MetaPill label={item.location || "場所未設定"} />
            </View>
            <Row label="練習メニュー" value={item.practiceMenu?.title} />
            <Row label="内容" value={item.content} />
            <Row label="メモ" value={item.memo} />
          </Card>

          <View style={{ gap: 10 }}>
            <Button onPress={() => router.push(`/practice/${practiceId}/edit`)}>編集</Button>
            <Button loading={deleting} loadingLabel="削除中..." onPress={confirmDelete} variant="danger">
              削除
            </Button>
          </View>
        </>
      ) : null}
    </Screen>
  );
}
