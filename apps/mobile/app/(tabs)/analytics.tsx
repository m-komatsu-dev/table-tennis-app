import { useCallback, useMemo, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { Text, View } from "react-native";
import { fetchMobileRecords } from "@/api/records";
import { formatDate, formatSetCount, resultLabels } from "@/components/format";
import { Button, Card, EmptyState, ErrorMessage, Header, LoadingState, MetaPill, Row, Screen, SectionTitle, colors } from "@/components/ui";
import type { MatchRecord, PracticeLog } from "@/types";
import { buildAnalyticsSummary, formatDuration, formatWinRate } from "@/utils/analytics";

export default function AnalyticsScreen() {
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
      setError(caught instanceof Error ? caught.message : "分析データを取得できませんでした");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const summary = useMemo(() => buildAnalyticsSummary(practices, matches), [practices, matches]);
  const hasRecords = practices.length > 0 || matches.length > 0;

  return (
    <Screen>
      <Header title="分析" subtitle="練習と試合の記録を簡単に振り返ります。" />
      <ErrorMessage actionLabel="再読み込み" message={error} onAction={load} />
      {loading ? <LoadingState /> : null}
      {!loading && !error && !hasRecords ? (
        <EmptyState actionLabel="練習記録を追加" onAction={() => router.push("/practice/new")}>
          まだ分析できる記録がありません。{"\n"}練習や試合を記録すると、ここに集計が表示されます。
        </EmptyState>
      ) : null}
      {!loading && hasRecords ? (
        <>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            <MetricCard label="総練習回数" value={`${summary.totalPractices}回`} />
            <MetricCard label="総練習時間" value={formatDuration(summary.totalPracticeMinutes)} />
            <MetricCard label="総試合数" value={`${summary.totalMatches}試合`} />
            <MetricCard label="勝利数" value={`${summary.wins}勝`} />
            <MetricCard label="敗北数" value={`${summary.losses}敗`} />
            <MetricCard label="勝率" value={formatWinRate(summary.winRate)} />
          </View>

          <Card>
            <SectionTitle title="直近5試合" />
            {summary.recentMatches.length > 0 ? (
              <View style={{ gap: 10 }}>
                {summary.recentMatches.map((match) => <RecentMatchRow key={match.id} item={match} />)}
              </View>
            ) : (
              <EmptyState>まだ試合記録がありません。</EmptyState>
            )}
          </Card>

          <Card>
            <SectionTitle title="最近の練習記録5件" />
            {summary.recentPractices.length > 0 ? (
              <View style={{ gap: 10 }}>
                {summary.recentPractices.map((practice) => <RecentPracticeRow key={practice.id} item={practice} />)}
              </View>
            ) : (
              <EmptyState>まだ練習記録がありません。</EmptyState>
            )}
          </Card>

          <Card>
            <SectionTitle title="よく対戦する相手" />
            {summary.frequentOpponents.length > 0 ? (
              <View style={{ gap: 10 }}>
                {summary.frequentOpponents.map((opponent) => (
                  <View key={opponent.name} style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
                    <Text style={{ color: colors.text, flex: 1, fontSize: 15, fontWeight: "800" }}>{opponent.name}</Text>
                    <Text style={{ color: colors.muted, fontSize: 14, fontWeight: "700" }}>{opponent.count}試合</Text>
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState>まだ対戦相手の記録がありません。</EmptyState>
            )}
          </Card>
        </>
      ) : null}
      <Button variant="secondary" onPress={() => router.push("/(tabs)/home")}>
        ホームへ戻る
      </Button>
    </Screen>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderRadius: 8,
        borderWidth: 1,
        flexBasis: "47%",
        flexGrow: 1,
        gap: 6,
        padding: 14
      }}
    >
      <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "700" }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: 22, fontWeight: "900", lineHeight: 28 }}>{value}</Text>
    </View>
  );
}

function RecentMatchRow({ item }: { item: MatchRecord }) {
  const resultTone = item.result === "WIN" ? "green" : item.result === "LOSE" ? "red" : "neutral";

  return (
    <View style={{ borderBottomColor: colors.border, borderBottomWidth: 1, gap: 8, paddingBottom: 10 }}>
      <Text style={{ color: colors.text, fontSize: 15, fontWeight: "900", lineHeight: 21 }}>
        {formatDate(item.playedAt)} vs {item.opponentName}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <MetaPill label={resultLabels[item.result]} tone={resultTone} />
        <MetaPill label={formatSetCount(item.scores)} tone="blue" />
      </View>
    </View>
  );
}

function RecentPracticeRow({ item }: { item: PracticeLog }) {
  return (
    <View style={{ borderBottomColor: colors.border, borderBottomWidth: 1, gap: 8, paddingBottom: 10 }}>
      <Text style={{ color: colors.text, fontSize: 15, fontWeight: "900", lineHeight: 21 }}>
        {formatDate(item.practicedAt)} {item.durationMin}分 {item.location || "場所未設定"}
      </Text>
      <Row label="内容" value={item.content || item.practiceMenu?.title} />
    </View>
  );
}
