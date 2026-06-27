import { useCallback, useState } from "react";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Alert, View } from "react-native";
import { deleteMatchRecord, fetchMatchRecord } from "@/api/match";
import { formatDate, formatScores, formatSetCount, matchTypeLabels, resultLabels } from "@/components/format";
import { Button, Card, ErrorMessage, Header, LoadingState, MetaPill, Row, Screen, SectionTitle } from "@/components/ui";
import type { MatchRecord } from "@/types";

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const matchId = Array.isArray(id) ? id[0] : id;
  const [item, setItem] = useState<MatchRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!matchId) {
      setError("試合記録が見つかりません");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchMatchRecord(matchId);
      setItem(result.matchRecord);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "試合記録を取得できませんでした");
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function confirmDelete() {
    if (!matchId || deleting) {
      return;
    }

    Alert.alert("試合記録を削除しますか？", "削除すると元に戻せません。", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          setDeleting(true);
          setError(null);

          try {
            await deleteMatchRecord(matchId);
            router.replace("/match");
          } catch (caught) {
            setError(caught instanceof Error ? caught.message : "試合記録を削除できませんでした");
            setDeleting(false);
          }
        }
      }
    ]);
  }

  const resultTone = item?.result === "WIN" ? "green" : "red";

  return (
    <Screen>
      <Header backLabel="一覧へ戻る" onBack={() => router.replace("/match")} title="試合記録詳細" />
      <ErrorMessage actionLabel="再読み込み" message={error} onAction={load} />
      {loading ? <LoadingState /> : null}
      {!loading && item ? (
        <>
          <Card>
            <SectionTitle title={`${formatDate(item.playedAt)} vs ${item.opponentName}`} />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              <MetaPill label={resultLabels[item.result]} tone={resultTone} />
              <MetaPill label={matchTypeLabels[item.matchType]} tone="blue" />
              <MetaPill label={formatSetCount(item.scores)} tone="green" />
            </View>
            <Row label="所属チーム" value={item.opponentTeam} />
            <Row label="スコア概要" value={formatScores(item.scores)} />
            <Row label="メモ" value={item.memo} />
          </Card>

          <View style={{ gap: 10 }}>
            <Button onPress={() => router.push(`/match/${matchId}/edit`)}>編集</Button>
            <Button loading={deleting} loadingLabel="削除中..." onPress={confirmDelete} variant="danger">
              削除
            </Button>
          </View>
        </>
      ) : null}
    </Screen>
  );
}
