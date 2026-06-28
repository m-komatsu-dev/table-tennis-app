import { useCallback, useMemo, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { fetchMobileRecords } from "@/api/records";
import { formatDate, formatSetCount, resultLabels } from "@/components/format";
import { Button, Card, EmptyState, ErrorMessage, Header, MetaPill, Row, Screen, SectionTitle, Segment, colors } from "@/components/ui";
import type { MatchRecord, PracticeLog } from "@/types";
import {
  analyticsPeriodOptions,
  buildAnalyticsSummary,
  filterRecordsByPeriod,
  formatDuration,
  formatMinutes,
  formatWinRate,
  getMatchResultSummary,
  getOpponentRanking,
  getPracticeMenuBreakdown,
  getPracticeMinutesSeries,
  getTrendComments,
  type AnalyticsPeriod,
  type MatchResultSummary,
  type OpponentSummary,
  type PracticeMenuSummary,
  type PracticeMinutesPoint
} from "@/utils/analytics";

export default function AnalyticsScreen() {
  const [practices, setPractices] = useState<PracticeLog[]>([]);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");
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

  const periodPractices = useMemo(
    () => filterRecordsByPeriod(practices, period, (practice) => practice.practicedAt),
    [period, practices]
  );
  const periodMatches = useMemo(
    () => filterRecordsByPeriod(matches, period, (match) => match.playedAt),
    [matches, period]
  );
  const summary = useMemo(
    () => buildAnalyticsSummary(periodPractices, periodMatches, period),
    [period, periodMatches, periodPractices]
  );
  const practiceSeries = useMemo(() => getPracticeMinutesSeries(periodPractices, period), [period, periodPractices]);
  const matchResults = useMemo(() => getMatchResultSummary(periodMatches), [periodMatches]);
  const opponentRanking = useMemo(() => getOpponentRanking(periodMatches), [periodMatches]);
  const menuBreakdown = useMemo(() => getPracticeMenuBreakdown(periodPractices), [periodPractices]);
  const trendComments = useMemo(
    () => getTrendComments(practices, periodPractices, periodMatches, menuBreakdown, summary),
    [menuBreakdown, periodMatches, periodPractices, practices, summary]
  );
  const hasRecords = practices.length > 0 || matches.length > 0;
  const hasPeriodRecords = periodPractices.length > 0 || periodMatches.length > 0;

  return (
    <Screen>
      <Header title="分析" subtitle="練習量、試合結果、最近の傾向を振り返ります。" />
      <ErrorMessage actionLabel="再読み込み" message={error} onAction={load} />
      {loading ? <AnalyticsLoadingState /> : null}
      {!loading && !error && !hasRecords ? <AnalyticsEmptyState /> : null}
      {!loading && !error && hasRecords ? (
        <>
          <Card>
            <SectionTitle title="期間" subtitle="見たい範囲を切り替えると、数値とグラフが更新されます。" />
            <Segment onChange={setPeriod} options={analyticsPeriodOptions} value={period} />
            {!hasPeriodRecords ? (
              <EmptyState>この期間の記録はまだありません。期間を変えるか、練習や試合を記録すると分析できます。</EmptyState>
            ) : null}
          </Card>

          <Button variant="secondary" onPress={() => router.push("/share/summary")}>
            今週のまとめを共有
          </Button>

          <View style={chartStyles.metricGrid}>
            <MetricCard label="総練習時間" value={formatDuration(summary.totalPracticeMinutes)} />
            <MetricCard label="総練習回数" value={`${summary.totalPractices}回`} />
            <MetricCard label="総試合数" value={`${summary.totalMatches}試合`} />
            <MetricCard label="勝率" value={formatWinRate(summary.winRate)} />
            <MetricCard label="1回あたり" value={summary.totalPractices > 0 ? formatMinutes(summary.averagePracticeMinutesPerSession) : "-"} />
            <MetricCard label="1日あたり" value={summary.totalPractices > 0 ? formatMinutes(summary.averagePracticeMinutesPerDay) : "-"} />
          </View>

          <WinRateCard summary={summary} />

          <TrendCard comments={trendComments} />

          <PracticeMinutesChart
            title="練習時間の推移"
            data={practiceSeries}
            emptyMessage="練習記録がまだありません。練習を記録すると、練習時間の推移が表示されます。"
          />

          <PracticeMenuBreakdownChart data={menuBreakdown} totalMinutes={summary.totalPracticeMinutes} />

          <MatchResultChart data={matchResults} totalMatches={summary.totalMatches} winRate={summary.winRate} />

          <OpponentRankingChart data={opponentRanking} totalMatches={summary.totalMatches} />

          <Card>
            <SectionTitle title="直近の試合記録" />
            {summary.recentMatches.length > 0 ? (
              <View style={{ gap: 10 }}>
                {summary.recentMatches.map((match) => <RecentMatchRow key={match.id} item={match} />)}
              </View>
            ) : (
              <EmptyState actionLabel="試合を記録する" onAction={() => router.push("/match/new")}>
                試合記録がまだありません。試合を記録すると、勝率や試合結果が表示されます。
              </EmptyState>
            )}
          </Card>

          <Card>
            <SectionTitle title="最近の練習記録" />
            {summary.recentPractices.length > 0 ? (
              <View style={{ gap: 10 }}>
                {summary.recentPractices.map((practice) => <RecentPracticeRow key={practice.id} item={practice} />)}
              </View>
            ) : (
              <EmptyState actionLabel="練習を記録する" onAction={() => router.push("/practice/new")}>
                練習記録がまだありません。練習を記録すると、練習時間の推移が表示されます。
              </EmptyState>
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
        まだ分析できる記録がありません。{"\n"}練習や試合を記録すると、ここにグラフや傾向が表示されます。
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
    <View style={chartStyles.metricCard}>
      <Text style={chartStyles.metricLabel}>{label}</Text>
      <Text adjustsFontSizeToFit minimumFontScale={0.78} numberOfLines={1} style={chartStyles.metricValue}>
        {value}
      </Text>
    </View>
  );
}

function WinRateCard({ summary }: { summary: ReturnType<typeof buildAnalyticsSummary> }) {
  return (
    <Card>
      <SectionTitle title="勝率" />
      {summary.totalMatches > 0 ? (
        <View style={chartStyles.winRateBody}>
          <Text style={chartStyles.winRateValue}>{formatWinRate(summary.winRate)}</Text>
          <Text style={chartStyles.winRateDetail}>
            {summary.wins}勝 {summary.losses}敗 {summary.draws}分
          </Text>
        </View>
      ) : (
        <EmptyState actionLabel="試合を記録する" onAction={() => router.push("/match/new")}>
          まだ試合記録がありません。{"\n"}試合を記録すると勝率が表示されます。
        </EmptyState>
      )}
    </Card>
  );
}

function TrendCard({ comments }: { comments: string[] }) {
  return (
    <Card>
      <SectionTitle title="最近の傾向" />
      {comments.length > 0 ? (
        <View style={{ gap: 9 }}>
          {comments.map((comment) => (
            <View key={comment} style={chartStyles.commentRow}>
              <View style={chartStyles.commentDot} />
              <Text style={chartStyles.commentText}>{comment}</Text>
            </View>
          ))}
        </View>
      ) : (
        <EmptyState>記録を追加すると、最近の傾向や課題が表示されます。</EmptyState>
      )}
    </Card>
  );
}

function PracticeMinutesChart({
  title,
  data,
  emptyMessage
}: {
  title: string;
  data: PracticeMinutesPoint[];
  emptyMessage: string;
}) {
  const maxMinutes = Math.max(...data.map((item) => item.minutes), 0);

  return (
    <Card>
      <SectionTitle title={title} />
      {maxMinutes > 0 ? (
        <View style={chartStyles.chartRows}>
          {data.map((item) => (
            <BarRow key={item.key} label={item.label} value={item.minutes} maxValue={maxMinutes} valueLabel={formatDuration(item.minutes)} />
          ))}
        </View>
      ) : (
        <EmptyState actionLabel="練習を記録する" onAction={() => router.push("/practice/new")}>
          {emptyMessage}
        </EmptyState>
      )}
    </Card>
  );
}

function PracticeMenuBreakdownChart({ data, totalMinutes }: { data: PracticeMenuSummary[]; totalMinutes: number }) {
  const maxMinutes = Math.max(...data.map((item) => item.minutes), 0);

  return (
    <Card>
      <SectionTitle title="練習メニュー別の練習時間" subtitle="練習メニュー未設定は「指定なし」として集計します。" />
      {totalMinutes > 0 && data.length > 0 ? (
        <View style={chartStyles.chartRows}>
          {data.map((item) => (
            <BarRow key={item.name} label={item.name} value={item.minutes} maxValue={maxMinutes} valueLabel={formatDuration(item.minutes)} />
          ))}
        </View>
      ) : (
        <EmptyState actionLabel="練習を記録する" onAction={() => router.push("/practice/new")}>
          練習記録がまだありません。練習を記録すると、メニュー別の練習時間が表示されます。
        </EmptyState>
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
        <EmptyState actionLabel="試合を記録する" onAction={() => router.push("/match/new")}>
          試合記録がまだありません。試合を記録すると、勝率や試合結果が表示されます。
        </EmptyState>
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
      <View style={chartStyles.barHeader}>
        <Text numberOfLines={1} style={chartStyles.barLabel}>
          {label}
        </Text>
        <Text numberOfLines={1} style={chartStyles.barValue}>
          {valueLabel}
        </Text>
      </View>
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
    </View>
  );
}

function RecentMatchRow({ item }: { item: MatchRecord }) {
  const resultTone = item.result === "WIN" ? "green" : item.result === "LOSE" ? "red" : "neutral";

  return (
    <View style={chartStyles.recentRow}>
      <Text style={chartStyles.recentTitle}>
        {formatDate(item.playedAt)} vs {item.opponentName}
      </Text>
      <View style={chartStyles.pillRow}>
        <MetaPill label={resultLabels[item.result]} tone={resultTone} />
        <MetaPill label={formatSetCount(item.scores)} tone="blue" />
      </View>
    </View>
  );
}

function RecentPracticeRow({ item }: { item: PracticeLog }) {
  return (
    <View style={chartStyles.recentRow}>
      <Text style={chartStyles.recentTitle}>
        {formatDate(item.practicedAt)} {item.durationMin}分 {item.location || "場所未設定"}
      </Text>
      <Row label="内容" value={item.practiceMenu?.title || item.content} />
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
    flex: 1,
    fontSize: 13,
    fontWeight: "800"
  },
  barHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between"
  },
  barRow: {
    gap: 7,
    minHeight: 42
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
    minWidth: 72
  },
  center: {
    alignItems: "center",
    gap: 4,
    paddingVertical: 8
  },
  chartRows: {
    gap: 14
  },
  commentDot: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 8,
    marginTop: 6,
    width: 8
  },
  commentRow: {
    flexDirection: "row",
    gap: 9
  },
  commentText: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 21
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
  },
  metricCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: "47%",
    flexGrow: 1,
    gap: 6,
    padding: 14
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700"
  },
  metricValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 28
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  recentRow: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    gap: 8,
    paddingBottom: 10
  },
  recentTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 21
  },
  winRateBody: {
    backgroundColor: "#ecfdf5",
    borderColor: "#a7f3d0",
    borderRadius: 8,
    borderWidth: 1,
    gap: 5,
    padding: 16
  },
  winRateDetail: {
    color: colors.primaryDark,
    fontSize: 15,
    fontWeight: "800"
  },
  winRateValue: {
    color: colors.primaryDark,
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 40
  }
});
