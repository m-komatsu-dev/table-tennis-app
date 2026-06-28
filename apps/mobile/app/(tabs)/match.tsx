import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { fetchMatchRecords } from "@/api/match";
import { formatDate, formatScores, formatSetCount, matchTypeLabels, resultLabels } from "@/components/format";
import { Button, Card, EmptyState, ErrorMessage, Header, LoadingState, MetaPill, Row, Screen, Segment, TextField, colors, styles } from "@/components/ui";
import type { MatchRecord } from "@/types";
import {
  datePresetOptions,
  filterMatchRecords,
  getMatchTypeOptions,
  type DatePreset,
  type MatchResultFilter,
  type MatchTypeFilter
} from "@/utils/recordFilters";

const defaultFilters = {
  keyword: "",
  datePreset: "all" as DatePreset,
  result: "all" as MatchResultFilter,
  matchType: "all" as MatchTypeFilter
};

const resultOptions: { label: string; value: MatchResultFilter }[] = [
  { label: "すべて", value: "all" },
  { label: resultLabels.WIN, value: "WIN" },
  { label: resultLabels.LOSE, value: "LOSE" },
  { label: resultLabels.DRAW, value: "DRAW" }
];

export default function MatchListScreen() {
  const [items, setItems] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [keyword, setKeyword] = useState(defaultFilters.keyword);
  const [datePreset, setDatePreset] = useState(defaultFilters.datePreset);
  const [result, setResult] = useState(defaultFilters.result);
  const [matchType, setMatchType] = useState(defaultFilters.matchType);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchMatchRecords();
      setItems(result.matchRecords);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "試合記録を取得できませんでした");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const goToNewMatch = useCallback(() => {
    router.push("/match/new");
  }, []);

  const resetFilters = useCallback(() => {
    setKeyword(defaultFilters.keyword);
    setDatePreset(defaultFilters.datePreset);
    setResult(defaultFilters.result);
    setMatchType(defaultFilters.matchType);
  }, []);

  const matchTypeOptions = useMemo(() => getMatchTypeOptions(items, matchTypeLabels), [items]);
  const filteredItems = useMemo(
    () => filterMatchRecords(items, { keyword, datePreset, result, matchType, matchTypeLabels }),
    [datePreset, items, keyword, matchType, result]
  );
  const hasFilters = keyword.trim() !== "" || datePreset !== "all" || result !== "all" || matchType !== "all";

  return (
    <Screen keyboardAware>
      <Header
        action={
          <Pressable onPress={goToNewMatch} style={styles.listAddButton}>
            <Text style={styles.buttonText}>追加</Text>
          </Pressable>
        }
        subtitle={`${items.length}件`}
        title="試合記録"
      />
      <ErrorMessage actionLabel="再読み込み" message={error} onAction={load} />
      {loading ? <LoadingState /> : null}
      {!loading && !error && items.length === 0 ? (
        <EmptyState actionLabel="試合記録を追加" onAction={goToNewMatch}>
          まだ試合記録がありません。{"\n"}最初の試合を記録してみましょう。
        </EmptyState>
      ) : null}
      {!loading && !error && items.length > 0 ? (
        <>
          <TextField
            label="キーワード検索"
            onChangeText={setKeyword}
            placeholder="対戦相手・所属・メモ・試合種別"
            returnKeyType="search"
            value={keyword}
          />
          {hasFilters ? (
            <Text style={{ color: colors.primaryDark, fontSize: 13, fontWeight: "800" }}>
              絞り込み中: 検索結果 {filteredItems.length}件
            </Text>
          ) : null}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable onPress={() => setFiltersOpen((open) => !open)} style={[styles.button, styles.secondaryButton, { flex: 1 }]}>
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>{filtersOpen ? "絞り込みを閉じる" : "絞り込み"}</Text>
            </Pressable>
            <Pressable
              disabled={!hasFilters}
              onPress={resetFilters}
              style={[styles.button, styles.secondaryButton, { flex: 1 }, !hasFilters && styles.disabledButton]}
            >
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>リセット</Text>
            </Pressable>
          </View>
          {filtersOpen ? (
            <Card>
              <FilterGroup label="日付範囲">
                <Segment onChange={setDatePreset} options={datePresetOptions} value={datePreset} />
              </FilterGroup>
              <FilterGroup label="勝敗">
                <Segment onChange={setResult} options={resultOptions} value={result} />
              </FilterGroup>
              <FilterGroup label="試合種別">
                <Segment onChange={setMatchType} options={matchTypeOptions} value={matchType} />
              </FilterGroup>
            </Card>
          ) : null}
          <Text style={{ color: colors.muted, fontSize: 13, fontWeight: "700" }}>
            {hasFilters ? "条件に一致した試合記録" : "すべての試合記録"} {filteredItems.length}件
          </Text>
          {filteredItems.length === 0 && hasFilters ? (
            <EmptyState actionLabel="条件をリセット" onAction={resetFilters}>
              条件に一致する試合記録がありません。{"\n"}検索条件を変更するか、絞り込みをリセットしてください。
            </EmptyState>
          ) : null}
        </>
      ) : null}
      {!loading && !error && filteredItems.map((item) => <MatchRecordCard key={item.id} item={item} />)}
      <Button variant="secondary" onPress={() => router.push("/(tabs)/home")}>
        ホームへ戻る
      </Button>
    </Screen>
  );
}

function FilterGroup({ children, label }: { children: ReactNode; label: string }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: colors.text, fontSize: 13, fontWeight: "800" }}>{label}</Text>
      {children}
    </View>
  );
}

function MatchRecordCard({ item }: { item: MatchRecord }) {
  const resultTone = item.result === "WIN" ? "green" : "red";

  return (
    <Pressable onPress={() => router.push(`/match/${item.id}`)}>
      <Card>
        <View style={{ gap: 8 }}>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: "900", lineHeight: 24 }}>
            {formatDate(item.playedAt)} vs {item.opponentName}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <MetaPill label={resultLabels[item.result]} tone={resultTone} />
            <MetaPill label={matchTypeLabels[item.matchType]} tone="blue" />
            <MetaPill label={formatSetCount(item.scores)} tone="green" />
          </View>
        </View>
        <Row label="所属チーム" value={item.opponentTeam} />
        <Row label="スコア概要" value={formatScores(item.scores)} />
        <Row label="メモ" value={item.memo} />
      </Card>
    </Pressable>
  );
}
