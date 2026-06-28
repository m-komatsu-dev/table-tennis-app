import { useCallback, useMemo, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { fetchMobileRecords } from "@/api/records";
import { formatSetCount, resultLabels } from "@/components/format";
import { Button, Card, EmptyState, ErrorMessage, Header, MetaPill, Row, Screen, SectionTitle, colors } from "@/components/ui";
import type { MatchRecord, PracticeLog } from "@/types";
import {
  buildCalendarSections,
  clampDateKeyToMonth,
  formatDateKeyLabel,
  getCurrentMonth,
  getMonthDays,
  getRecordsForDate,
  getTodayKey,
  groupRecordsByDate,
  moveMonth,
  type CalendarItem,
  type RecordsByDate
} from "@/utils/calendar";

const weekLabels = ["日", "月", "火", "水", "木", "金", "土"];

export default function CalendarScreen() {
  const initialMonth = useMemo(() => getCurrentMonth(), []);
  const initialTodayKey = useMemo(() => getTodayKey(), []);
  const [practices, setPractices] = useState<PracticeLog[]>([]);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [displayMonth, setDisplayMonth] = useState(initialMonth);
  const [selectedDateKey, setSelectedDateKey] = useState(initialTodayKey);
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
      const message = caught instanceof Error ? caught.message : null;
      setError(message ? `カレンダー情報を読み込めませんでした。${message}` : "カレンダー情報を読み込めませんでした。");
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
  const recordsByDate = useMemo(() => groupRecordsByDate(practices, matches), [practices, matches]);
  const monthCells = useMemo(() => getMonthDays(displayMonth.year, displayMonth.month), [displayMonth]);
  const selectedRecords = useMemo(() => getRecordsForDate(recordsByDate, selectedDateKey), [recordsByDate, selectedDateKey]);
  const hasRecords = practices.length + matches.length > 0;
  const monthTitle = `${displayMonth.year}年${displayMonth.month + 1}月`;

  const goToMonth = useCallback((amount: number) => {
    setDisplayMonth((current) => {
      const next = moveMonth(current.year, current.month, amount);
      setSelectedDateKey((currentSelected) => clampDateKeyToMonth(currentSelected, next.year, next.month));
      return next;
    });
  }, []);

  return (
    <Screen>
      <Header title="カレンダー" subtitle="月間カレンダーで練習と試合の記録日を確認できます。" />
      <ErrorMessage actionLabel="再読み込み" message={error} onAction={load} />
      {loading ? <CalendarLoadingState /> : null}
      {!loading && !error ? (
        <MonthCalendar
          monthCells={monthCells}
          monthTitle={monthTitle}
          onNextMonth={() => goToMonth(1)}
          onPreviousMonth={() => goToMonth(-1)}
          onSelectDate={setSelectedDateKey}
          recordsByDate={recordsByDate}
          selectedDateKey={selectedDateKey}
          todayKey={initialTodayKey}
        />
      ) : null}
      {!loading && !error && !hasRecords ? (
        <View style={calendarStyles.emptyActions}>
          <EmptyState>
            まだカレンダーに表示できる記録がありません。{"\n"}練習や試合を記録すると、月間カレンダーに表示されます。
          </EmptyState>
          <View style={calendarStyles.emptyButtonRow}>
            <View style={calendarStyles.emptyButton}>
              <Button onPress={() => router.push("/practice/new")}>練習を記録する</Button>
            </View>
            <View style={calendarStyles.emptyButton}>
              <Button variant="secondary" onPress={() => router.push("/match/new")}>
                試合を記録する
              </Button>
            </View>
          </View>
        </View>
      ) : null}
      {!loading && !error && hasRecords ? (
        <View style={{ gap: 10 }}>
          <SectionTitle title={`${formatDateKeyLabel(selectedDateKey)} の記録`} subtitle={`${selectedRecords.length}件`} />
          {selectedRecords.length === 0 ? (
            <EmptyState>
              この日の記録はありません。{"\n"}練習や試合を記録すると、ここに表示されます。
            </EmptyState>
          ) : (
            selectedRecords.map((item) => <CalendarRecordCard item={item} key={`selected-${item.kind}-${item.record.id}`} />)
          )}
        </View>
      ) : null}
      {!loading && !error && sections.length > 0 ? (
        <View style={{ gap: 12 }}>
          <SectionTitle title="日付別一覧" subtitle="これまでの簡易カレンダー表示です。" />
          {sections.map((section) => (
            <View key={section.key} style={{ gap: 10 }}>
              <SectionTitle title={section.title} subtitle={`${section.items.length}件`} />
              {section.items.map((item) => <CalendarRecordCard item={item} key={`${item.kind}-${item.record.id}`} />)}
            </View>
          ))}
        </View>
      ) : null}
      <Button variant="secondary" onPress={() => router.push("/(tabs)/home")}>
        ホームへ戻る
      </Button>
    </Screen>
  );
}

function CalendarLoadingState() {
  return (
    <View style={calendarStyles.loading}>
      <ActivityIndicator color={colors.primary} />
      <Text style={calendarStyles.loadingText}>カレンダーを読み込み中...</Text>
    </View>
  );
}

function MonthCalendar({
  monthCells,
  monthTitle,
  onNextMonth,
  onPreviousMonth,
  onSelectDate,
  recordsByDate,
  selectedDateKey,
  todayKey
}: {
  monthCells: ReturnType<typeof getMonthDays>;
  monthTitle: string;
  onNextMonth: () => void;
  onPreviousMonth: () => void;
  onSelectDate: (dateKey: string) => void;
  recordsByDate: RecordsByDate;
  selectedDateKey: string;
  todayKey: string;
}) {
  return (
    <Card>
      <View style={calendarStyles.monthHeader}>
        <Pressable onPress={onPreviousMonth} style={calendarStyles.monthButton}>
          <Text style={calendarStyles.monthButtonText}>‹ 前月</Text>
        </Pressable>
        <Text style={calendarStyles.monthTitle}>{monthTitle}</Text>
        <Pressable onPress={onNextMonth} style={calendarStyles.monthButton}>
          <Text style={calendarStyles.monthButtonText}>翌月 ›</Text>
        </Pressable>
      </View>
      <View style={calendarStyles.weekRow}>
        {weekLabels.map((label) => (
          <Text key={label} style={calendarStyles.weekLabel}>
            {label}
          </Text>
        ))}
      </View>
      <View style={calendarStyles.monthGrid}>
        {monthCells.map((cell) => {
          const records = cell.dateKey ? recordsByDate[cell.dateKey] ?? [] : [];
          const hasPractice = records.some((item) => item.kind === "practice");
          const hasMatch = records.some((item) => item.kind === "match");
          const selected = cell.dateKey === selectedDateKey;
          const today = cell.dateKey === todayKey;

          return (
            <View key={cell.key} style={calendarStyles.dayCellWrap}>
              {cell.dateKey && cell.day ? (
                <Pressable
                  accessibilityLabel={`${cell.dateKey}を選択`}
                  onPress={() => onSelectDate(cell.dateKey as string)}
                  style={[
                    calendarStyles.dayCell,
                    today && calendarStyles.todayCell,
                    selected && calendarStyles.selectedCell
                  ]}
                >
                  <Text style={[calendarStyles.dayText, selected && calendarStyles.selectedDayText]}>{cell.day}</Text>
                  <View style={calendarStyles.recordDots}>
                    {hasPractice ? <View style={[calendarStyles.recordDot, calendarStyles.practiceDot]} /> : null}
                    {hasMatch ? <View style={[calendarStyles.recordDot, calendarStyles.matchDot]} /> : null}
                  </View>
                </Pressable>
              ) : (
                <View style={calendarStyles.blankCell} />
              )}
            </View>
          );
        })}
      </View>
      <View style={calendarStyles.legendRow}>
        <LegendDot color={colors.primary} label="練習" />
        <LegendDot color={colors.blue} label="試合" />
        <Text style={calendarStyles.legendText}>今日: 枠線 / 選択中: 緑背景</Text>
      </View>
    </Card>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={calendarStyles.legendItem}>
      <View style={[calendarStyles.recordDot, { backgroundColor: color }]} />
      <Text style={calendarStyles.legendText}>{label}</Text>
    </View>
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

const calendarStyles = StyleSheet.create({
  blankCell: {
    minHeight: 48
  },
  dayCell: {
    alignItems: "center",
    borderColor: "transparent",
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    minHeight: 48,
    justifyContent: "center",
    paddingVertical: 6
  },
  dayCellWrap: {
    padding: 2,
    width: "14.2857%"
  },
  dayText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800"
  },
  emptyActions: {
    gap: 10
  },
  emptyButton: {
    flex: 1,
    minWidth: 130
  },
  emptyButtonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  legendItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5
  },
  legendRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  legendText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700"
  },
  loading: {
    alignItems: "center",
    gap: 10,
    padding: 24
  },
  loadingText: {
    color: colors.muted,
    fontSize: 14
  },
  matchDot: {
    backgroundColor: colors.blue
  },
  monthButton: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: 10
  },
  monthButtonText: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: "900"
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  monthHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between"
  },
  monthTitle: {
    color: colors.text,
    flex: 1,
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center"
  },
  practiceDot: {
    backgroundColor: colors.primary
  },
  recordDot: {
    borderRadius: 999,
    height: 6,
    width: 6
  },
  recordDots: {
    flexDirection: "row",
    gap: 4,
    minHeight: 6
  },
  selectedCell: {
    backgroundColor: "#ecfdf5",
    borderColor: "#a7f3d0"
  },
  selectedDayText: {
    color: colors.primaryDark
  },
  todayCell: {
    borderColor: colors.primary
  },
  weekLabel: {
    color: colors.muted,
    flex: 1,
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center"
  },
  weekRow: {
    flexDirection: "row",
    paddingTop: 4
  }
});

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
