import { useCallback, useMemo, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { fetchMobileRecords } from "@/api/records";
import { formatDate, formatSetCount, resultLabels } from "@/components/format";
import { Button, Card, EmptyState, ErrorMessage, Header, MetaPill, Row, Screen, SectionTitle, colors } from "@/components/ui";
import type { MatchRecord, PracticeLog } from "@/types";
import {
  buildAnalyticsSummary,
  formatDuration,
  formatWinRate,
  getLast6MonthsPracticeMinutes,
  getLast7DaysPracticeMinutes,
  getMatchResultSummary,
  getOpponentRanking,
  type MatchResultSummary,
  type OpponentSummary,
  type PracticeMinutesPoint
} from "@/utils/analytics";

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
  const last7Days = useMemo(() => getLast7DaysPracticeMinutes(practices), [practices]);
  const last6Months = useMemo(() => getLast6MonthsPracticeMinutes(practices), [practices]);
  const matchResults = useMemo(() => getMatchResultSummary(matches), [matches]);
  const opponentRanking = useMemo(() => getOpponentRanking(matches), [matches]);
  const hasRecords = practices.length > 0 || matches.length > 0;

  return (
    <Screen>
      <Header title="分析" subtitle="練習と試合の記録を簡単に振り返ります。" />
      <ErrorMessage actionLabel="再読み込み" message={error} onAction={load} />
      {loading ? <AnalyticsLoadingState /> : null}
      {!loading && !error && !hasRecords ? (
        <AnalyticsEmptyState />
      ) : null}
      {!loading && !error && hasRecords ? (
        <>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            <MetricCard label="総練習回数" value={`${summary.totalPractices}回`} />
            <MetricCard label="総練習時間" value={formatDuration(summary.totalPracticeMinutes)} />
            <MetricCard label="総試合数" value={`${summary.totalMatches}試合`} />
            <MetricCard label="勝利数" value={`${summary.wins}勝`} />
            <MetricCard label="敗北数" value={`${summary.losses}敗`} />
            <MetricCard label="勝率" value={formatWinRate(summary.winRate)} />
          </View>

          <PracticeMinutesChart title="直近7日の練習時間" data={last7Days} emptyMessage="練習記録がまだありません。練習時間のグラフは、練習を記録すると表示されます。" />

          <PracticeMinutesChart
            title="月別の練習時間"
            data={last6Months}
            emptyMessage="練習記録がまだありません。月別の練習時間は、練習を記録すると表示されます。"
            showReadableDuration
          />

          <MatchResultChart data={matchResults} totalMatches={summary.totalMatches} winRate={summary.winRate} />

          <OpponentRankingChart data={opponentRanking} totalMatches={summary.totalMatches} />

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
            {opponentRanking.length > 0 ? (
              <View style={{ gap: 10 }}>
                {opponentRanking.slice(0, 3).map((opponent) => (
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

function AnalyticsLoadingState() {
  return (
    <View style={chartStyles.center}>
      <ActivityIndicator color={colors.primary} />
      <Text style={chartStyles.loadingText}>分析データを読み込み中...</Text>
    </View>
  );
}

function AnalyticsEmptyState() {
  return (
    <View style={chartStyles.emptyPanel}>
      <Text style={chartStyles.emptyText}>
        まだ分析できる記録がありません。{"\n"}練習や試合を記録すると、ここにグラフが表示されます。
      </Text>
      <View style={chartStyles.emptyActions}>
        <Pressable onPress={() => router.push("/practice/new")} style={chartStyles.emptyPrimaryAction}>
          <Text style={chartStyles.emptyPrimaryActionText}>練習を記録する</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/match/new")} style={chartStyles.emptySecondaryAction}>
          <Text style={chartStyles.emptySecondaryActionText}>試合を記録する</Text>
        </Pressable>
      </View>
    </View>
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

function PracticeMinutesChart({
  title,
  data,
  emptyMessage,
  showReadableDuration = false
}: {
  title: string;
  data: PracticeMinutesPoint[];
  emptyMessage: string;
  showReadableDuration?: boolean;
}) {
  const maxMinutes = Math.max(...data.map((item) => item.minutes), 0);

  return (
    <Card>
      <SectionTitle title={title} />
      {maxMinutes > 0 ? (
        <View style={chartStyles.chartRows}>
          {data.map((item) => (
            <BarRow
              key={item.key}
              label={item.label}
              value={item.minutes}
              maxValue={maxMinutes}
              valueLabel={showReadableDuration ? formatDuration(item.minutes) : `${item.minutes}分`}
            />
          ))}
        </View>
      ) : (
        <EmptyState>{emptyMessage}</EmptyState>
      )}
    </Card>
  );
}

function MatchResultChart({
  data,
  totalMatches,
  winRate
}: {
  data: MatchResultSummary[];
  totalMatches: number;
  winRate: number;
}) {
  const maxCount = Math.max(...data.map((item) => item.count), 0);

  return (
    <Card>
      <SectionTitle title="試合結果" subtitle={`勝率 ${formatWinRate(winRate)}`} />
      {totalMatches > 0 ? (
        <View style={chartStyles.chartRows}>
          {data.map((item) => (
            <BarRow
              key={item.result}
              label={item.label}
              value={item.count}
              maxValue={maxCount}
              valueLabel={`${item.count}試合`}
              tone={item.result === "WIN" ? "green" : item.result === "LOSE" ? "red" : "neutral"}
            />
          ))}
        </View>
      ) : (
        <EmptyState>試合記録がまだありません。試合結果のグラフは、試合を記録すると表示されます。</EmptyState>
      )}
    </Card>
  );
}

function OpponentRankingChart({ data, totalMatches }: { data: OpponentSummary[]; totalMatches: number }) {
  const maxCount = Math.max(...data.map((item) => item.count), 0);

  return (
    <Card>
      <SectionTitle title="よく対戦する相手ランキング" />
      {totalMatches > 0 && data.length > 0 ? (
        <View style={chartStyles.chartRows}>
          {data.map((item) => (
            <BarRow key={item.name} label={item.name} value={item.count} maxValue={maxCount} valueLabel={`${item.count}試合`} />
          ))}
        </View>
      ) : (
        <EmptyState>試合記録がまだありません。対戦相手のランキングは、試合を記録すると表示されます。</EmptyState>
      )}
    </Card>
  );
}

function BarRow({
  label,
  value,
  maxValue,
  valueLabel,
  tone = "green"
}: {
  label: string;
  value: number;
  maxValue: number;
  valueLabel: string;
  tone?: "green" | "red" | "neutral";
}) {
  const percentage = maxValue > 0 ? Math.max((value / maxValue) * 100, value > 0 ? 8 : 0) : 0;

  return (
    <View style={chartStyles.barRow}>
      <Text numberOfLines={1} style={chartStyles.barLabel}>
        {label}
      </Text>
      <View style={chartStyles.barTrack}>
        <View
          style={[
            chartStyles.barFill,
            tone === "red" && chartStyles.barFillRed,
            tone === "neutral" && chartStyles.barFillNeutral,
            { width: `${percentage}%` }
          ]}
        />
      </View>
      <Text numberOfLines={1} style={chartStyles.barValue}>
        {valueLabel}
      </Text>
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

const chartStyles = StyleSheet.create({
  barFill: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 12,
    minWidth: 0
  },
  barFillNeutral: {
    backgroundColor: colors.faint
  },
  barFillRed: {
    backgroundColor: colors.danger
  },
  barLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
    width: 58
  },
  barRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    minHeight: 28
  },
  barTrack: {
    backgroundColor: "#ecfdf5",
    borderRadius: 999,
    flex: 1,
    height: 12,
    overflow: "hidden"
  },
  barValue: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "right",
    width: 68
  },
  center: {
    gap: 4
  },
  chartRows: {
    gap: 11
  },
  emptyActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  emptyPanel: {
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 16
  },
  emptyPrimaryAction: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 8,
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: 14
  },
  emptyPrimaryActionText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800"
  },
  emptySecondaryAction: {
    alignItems: "center",
    backgroundColor: "#ecfdf5",
    borderColor: "#a7f3d0",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: 14
  },
  emptySecondaryActionText: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: "800"
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20
  },
  loadingText: {
    color: colors.muted,
    fontSize: 14,
    textAlign: "center"
  }
});
