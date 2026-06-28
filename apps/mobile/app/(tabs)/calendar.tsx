import { useCallback, useMemo, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { fetchMobileRecords } from "@/api/records";
import { formatSetCount, resultLabels } from "@/components/format";
import { Button, Card, EmptyState, ErrorMessage, Header, LoadingState, MetaPill, Row, Screen, SectionTitle, colors } from "@/components/ui";
import type { MatchRecord, PracticeLog } from "@/types";
import { buildCalendarSections, type CalendarItem } from "@/utils/calendar";

export default function CalendarScreen() {
  const [practices, setPractices] = useState<PracticeLog[]>([]);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchMobileRecords();
      setPractices(result.practiceLogs);
      setMatches(result.matchRecords);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "カレンダーの記録を取得できませんでした");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const sections = useMemo(() => buildCalendarSections(practices, matches), [practices, matches]);

  return (
    <Screen>
      <Header title="カレンダー" subtitle="日付ごとに練習と試合をまとめて表示します。" />
      <ErrorMessage actionLabel="再読み込み" message={error} onAction={load} />
      {loading ? <LoadingState /> : null}
      {!loading && !error && sections.length === 0 ? (
        <EmptyState actionLabel="練習記録を追加" onAction={() => router.push("/practice/new")}>
          まだカレンダーに表示できる記録がありません。{"\n"}練習や試合を記録すると、日付ごとに表示されます。
        </EmptyState>
      ) : null}
      {!loading && sections.map((section) => (
        <View key={section.key} style={{ gap: 10 }}>
          <SectionTitle title={section.title} subtitle={`${section.items.length}件`} />
          {section.items.map((item) => <CalendarRecordCard item={item} key={`${item.kind}-${item.record.id}`} />)}
        </View>
      ))}
      <Button variant="secondary" onPress={() => router.push("/(tabs)/home")}>
        ホームへ戻る
      </Button>
    </Screen>
  );
}

function CalendarRecordCard({ item }: { item: CalendarItem }) {
  if (item.kind === "practice") {
    return <PracticeCalendarCard item={item.record} />;
  }

  return <MatchCalendarCard item={item.record} />;
}

function PracticeCalendarCard({ item }: { item: PracticeLog }) {
  return (
    <Pressable onPress={() => router.push(`/practice/${item.id}`)}>
      <Card>
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <MetaPill label="練習" tone="green" />
            <MetaPill label={`${item.durationMin}分`} tone="green" />
            <MetaPill label={item.location || "場所未設定"} />
          </View>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: "900", lineHeight: 22 }}>
            {item.practiceMenu?.title || item.content || "練習記録"}
          </Text>
        </View>
        <Row label="内容" value={item.content} />
        <Row label="メモ" value={item.memo} />
      </Card>
    </Pressable>
  );
}

function MatchCalendarCard({ item }: { item: MatchRecord }) {
  const resultTone = item.result === "WIN" ? "green" : item.result === "LOSE" ? "red" : "neutral";

  return (
    <Pressable onPress={() => router.push(`/match/${item.id}`)}>
      <Card>
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <MetaPill label="試合" tone="blue" />
            <MetaPill label={resultLabels[item.result]} tone={resultTone} />
            <MetaPill label={formatSetCount(item.scores)} />
          </View>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: "900", lineHeight: 22 }}>
            vs {item.opponentName}
          </Text>
        </View>
        <Row label="所属チーム" value={item.opponentTeam} />
        <Row label="メモ" value={item.memo} />
      </Card>
    </Pressable>
  );
}
