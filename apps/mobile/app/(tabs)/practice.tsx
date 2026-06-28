import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { fetchPracticeLogs } from "@/api/practice";
import { formatDate } from "@/components/format";
import { Button, Card, EmptyState, ErrorMessage, Header, LoadingState, MetaPill, Row, Screen, Segment, TextField, colors, styles } from "@/components/ui";
import type { PracticeLog } from "@/types";
import {
  datePresetOptions,
  filterPracticeRecords,
  getLocationOptions,
  getPracticeMenuOptions,
  type DatePreset,
  type LocationFilter,
  type PracticeMenuFilter
} from "@/utils/recordFilters";

const defaultFilters = {
  keyword: "",
  datePreset: "all" as DatePreset,
  practiceMenu: "all" as PracticeMenuFilter,
  location: "all" as LocationFilter
};

export default function PracticeListScreen() {
  const [items, setItems] = useState<PracticeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [keyword, setKeyword] = useState(defaultFilters.keyword);
  const [datePreset, setDatePreset] = useState(defaultFilters.datePreset);
  const [practiceMenu, setPracticeMenu] = useState(defaultFilters.practiceMenu);
  const [location, setLocation] = useState(defaultFilters.location);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPracticeLogs();
      setItems(result.practiceLogs);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "練習記録を取得できませんでした");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const goToNewPractice = useCallback(() => {
    router.push("/practice/new");
  }, []);

  const resetFilters = useCallback(() => {
    setKeyword(defaultFilters.keyword);
    setDatePreset(defaultFilters.datePreset);
    setPracticeMenu(defaultFilters.practiceMenu);
    setLocation(defaultFilters.location);
  }, []);

  const practiceMenuOptions = useMemo(() => getPracticeMenuOptions(items), [items]);
  const locationOptions = useMemo(() => getLocationOptions(items), [items]);
  const filteredItems = useMemo(
    () => filterPracticeRecords(items, { keyword, datePreset, practiceMenu, location }),
    [datePreset, items, keyword, location, practiceMenu]
  );
  const hasFilters = keyword.trim() !== "" || datePreset !== "all" || practiceMenu !== "all" || location !== "all";

  return (
    <Screen keyboardAware>
      <Header
        action={
          <Pressable onPress={goToNewPractice} style={styles.listAddButton}>
            <Text style={styles.buttonText}>追加</Text>
          </Pressable>
        }
        subtitle={`${items.length}件`}
        title="練習記録"
      />
      <ErrorMessage actionLabel="再読み込み" message={error} onAction={load} />
      {loading ? <LoadingState /> : null}
      {!loading && !error && items.length === 0 ? (
        <EmptyState actionLabel="練習記録を追加" onAction={goToNewPractice}>
          まだ練習記録がありません。{"\n"}最初の練習を記録してみましょう。
        </EmptyState>
      ) : null}
      {!loading && !error && items.length > 0 ? (
        <>
          <TextField
            label="キーワード検索"
            onChangeText={setKeyword}
            placeholder="内容・メモ・場所・練習メニュー"
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
              <FilterGroup label="練習メニュー">
                <Segment onChange={setPracticeMenu} options={practiceMenuOptions} value={practiceMenu} />
              </FilterGroup>
              <FilterGroup label="場所">
                <Segment onChange={setLocation} options={locationOptions} value={location} />
              </FilterGroup>
            </Card>
          ) : null}
          <Text style={{ color: colors.muted, fontSize: 13, fontWeight: "700" }}>
            {hasFilters ? "条件に一致した練習記録" : "すべての練習記録"} {filteredItems.length}件
          </Text>
          {filteredItems.length === 0 && hasFilters ? (
            <EmptyState actionLabel="条件をリセット" onAction={resetFilters}>
              条件に一致する練習記録がありません。{"\n"}検索条件を変更するか、絞り込みをリセットしてください。
            </EmptyState>
          ) : null}
        </>
      ) : null}
      {!loading && !error && filteredItems.map((item) => <PracticeLogCard key={item.id} item={item} />)}
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

function PracticeLogCard({ item }: { item: PracticeLog }) {
  return (
    <Pressable onPress={() => router.push(`/practice/${item.id}`)}>
      <Card>
        <View style={{ flexDirection: "row", gap: 10, justifyContent: "space-between" }}>
          <View style={{ flex: 1, gap: 8 }}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: "900", lineHeight: 24 }}>
              {formatDate(item.practicedAt)}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              <MetaPill label={`${item.durationMin}分`} tone="green" />
              <MetaPill label={item.location || "場所未設定"} />
            </View>
          </View>
        </View>
        <Row label="練習メニュー" value={item.practiceMenu?.title} />
        <Row label="内容" value={item.content} />
      </Card>
    </Pressable>
  );
}
