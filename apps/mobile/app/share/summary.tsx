import * as Clipboard from "expo-clipboard";
import { useCallback, useMemo, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { fetchMobileRecords } from "@/api/records";
import { Button, Card, EmptyState, ErrorMessage, Header, LoadingState, Row, Screen, SectionTitle, colors } from "@/components/ui";
import type { MatchRecord, PracticeLog } from "@/types";
import {
  buildAnalyticsSummary,
  filterRecordsByPeriod,
  formatDuration,
  formatWinRate,
  getPracticeMenuBreakdown,
  getTrendComments
} from "@/utils/analytics";
import { buildSummaryShareText, formatShareDateRange, shareTags } from "@/utils/share";

export default function SummaryShareScreen() {
  const [practices, setPractices] = useState<PracticeLog[]>([]);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchMobileRecords();
      setPractices(result.practiceLogs);
      setMatches(result.matchRecords);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "分析まとめを作成できませんでした");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const today = useMemo(() => new Date(), []);
  const weekStart = useMemo(() => {
    const date = new Date(today);
    date.setDate(date.getDate() - 6);
    return date;
  }, [today]);
  const weekPractices = useMemo(
    () => filterRecordsByPeriod(practices, "7d", (practice) => practice.practicedAt, today),
    [practices, today]
  );
  const weekMatches = useMemo(
    () => filterRecordsByPeriod(matches, "7d", (match) => match.playedAt, today),
    [matches, today]
  );
  const summary = useMemo(() => buildAnalyticsSummary(weekPractices, weekMatches, "7d", today), [today, weekMatches, weekPractices]);
  const menuBreakdown = useMemo(() => getPracticeMenuBreakdown(weekPractices), [weekPractices]);
  const trendComments = useMemo(
    () => getTrendComments(practices, weekPractices, weekMatches, menuBreakdown, summary, today),
    [menuBreakdown, matches, practices, summary, today, weekMatches, weekPractices]
  );
  const periodLabel = useMemo(() => formatShareDateRange(weekStart, today), [today, weekStart]);
  const topMenu = menuBreakdown[0];
  const coachComment = trendComments[0];
  const shareText = useMemo(
    () => buildSummaryShareText({ periodLabel, summary, topMenu, coachComment }),
    [coachComment, periodLabel, summary, topMenu]
  );
  const hasRecords = weekPractices.length > 0 || weekMatches.length > 0;

  async function copyText() {
    await Clipboard.setStringAsync(shareText);
    setCopied(true);
  }

  return (
    <Screen>
      <Header backLabel="分析へ戻る" onBack={() => router.back()} title="今週のまとめを共有" />
      <ErrorMessage actionLabel="再読み込み" message={error} onAction={load} />
      {loading ? <LoadingState /> : null}
      {!loading && !error && !hasRecords ? (
        <EmptyState>今週の記録がまだありません。練習や試合を記録すると共有カードを作成できます。</EmptyState>
      ) : null}
      {!loading && !error && hasRecords ? (
        <>
          <View style={shareStyles.card}>
            <Text style={shareStyles.kicker}>今週の卓球まとめ</Text>
            <Text style={shareStyles.title}>{periodLabel}</Text>
            <View style={shareStyles.metricGrid}>
              <Metric label="練習時間" value={formatDuration(summary.totalPracticeMinutes)} />
              <Metric label="練習回数" value={`${summary.totalPractices}回`} />
              <Metric label="試合数" value={`${summary.totalMatches}試合`} />
              <Metric label="勝率" value={formatWinRate(summary.winRate)} />
            </View>
            <View style={shareStyles.divider} />
            <Row label="よく練習したメニュー" value={topMenu?.name} />
            <Row label="AIコーチの一言" value={coachComment} />
            <Text style={shareStyles.tags}>{shareTags}</Text>
          </View>

          <Card>
            <SectionTitle title="投稿文プレビュー" />
            <Text style={shareStyles.preview}>{shareText}</Text>
          </Card>

          {copied ? (
            <Card>
              <Text style={shareStyles.copiedTitle}>投稿文をコピーしました</Text>
              <Text style={shareStyles.copiedText}>Xなどに貼り付けて共有できます</Text>
            </Card>
          ) : null}

          <Button onPress={copyText}>投稿文をコピー</Button>
        </>
      ) : null}
    </Screen>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={shareStyles.metric}>
      <Text adjustsFontSizeToFit minimumFontScale={0.78} numberOfLines={1} style={shareStyles.metricValue}>
        {value}
      </Text>
      <Text style={shareStyles.metricLabel}>{label}</Text>
    </View>
  );
}

const shareStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: "#bbf7d0",
    borderRadius: 20,
    borderWidth: 1,
    gap: 14,
    padding: 22,
    shadowColor: "#064e3b",
    shadowOpacity: 0.08,
    shadowRadius: 18
  },
  kicker: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: "800"
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900"
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  metric: {
    backgroundColor: "#ecfdf5",
    borderRadius: 14,
    minWidth: "47%",
    padding: 14
  },
  metricValue: {
    color: colors.primaryDark,
    fontSize: 20,
    fontWeight: "900"
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3
  },
  divider: {
    backgroundColor: colors.border,
    height: 1
  },
  tags: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700"
  },
  preview: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 22
  },
  copiedTitle: {
    color: colors.primaryDark,
    fontSize: 16,
    fontWeight: "900"
  },
  copiedText: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4
  }
});
