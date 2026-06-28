import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { generateAiCoachAdvice, type AiCoachResult } from "@/api/ai";
import { fetchMobileRecords } from "@/api/records";
import { Button, Card, EmptyState, ErrorMessage, Header, Screen, SectionTitle, colors } from "@/components/ui";
import type { MatchRecord, PracticeLog } from "@/types";

export default function AiCoachScreen() {
  const [practices, setPractices] = useState<PracticeLog[]>([]);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiCoachResult | null>(null);

  const load = useCallback(async () => {
    setLoadingRecords(true);
    setError(null);
    try {
      const records = await fetchMobileRecords();
      setPractices(records.practiceLogs);
      setMatches(records.matchRecords);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "記録を取得できませんでした");
    } finally {
      setLoadingRecords(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const recordCount = practices.length + matches.length;
  const hasSparseData = recordCount < 3;

  async function handleGenerate() {
    if (generating) return;

    setGenerating(true);
    setError(null);
    try {
      const response = await generateAiCoachAdvice(practices, matches);
      setResult(response.result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "AIコーチの生成に失敗しました");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Screen>
      <Header
        backLabel="ホーム"
        onBack={() => router.back()}
        subtitle="最近の練習・試合をもとに、次にやるべき練習を提案します。"
        title="AIコーチ"
      />

      <ErrorMessage actionLabel="再読み込み" message={error} onAction={loadingRecords ? undefined : load} />

      {loadingRecords ? (
        <View style={screenStyles.centerPanel}>
          <ActivityIndicator color={colors.primary} />
          <Text style={screenStyles.mutedText}>記録を読み込み中...</Text>
        </View>
      ) : (
        <>
          <Card>
            <SectionTitle title="最近の記録を分析" />
            <Text style={screenStyles.description}>
              直近の練習・試合と分析データだけをサーバーへ送り、AIコーチが短く具体的に振り返ります。
            </Text>
            {hasSparseData ? (
              <EmptyState>
                まだ分析できる記録が少ないです。{"\n"}練習や試合をいくつか記録すると、より具体的なアドバイスが表示されます。
              </EmptyState>
            ) : null}
            <Button
              disabled={recordCount === 0}
              loading={generating}
              loadingLabel="AIコーチが分析中..."
              onPress={handleGenerate}
            >
              AIコーチに分析してもらう
            </Button>
          </Card>

          {recordCount === 0 ? (
            <EmptyState actionLabel="練習を記録する" onAction={() => router.push("/practice/new")}>
              まだ記録がありません。練習や試合を記録するとAIコーチを使えます。
            </EmptyState>
          ) : null}

          {result ? <AdviceCards result={result} /> : null}
        </>
      )}
    </Screen>
  );
}

function AdviceCards({ result }: { result: AiCoachResult }) {
  return (
    <View style={{ gap: 12 }}>
      <AdviceList title="良かった点" items={result.goodPoints} />
      <AdviceList title="課題" items={result.issues} />
      <AdviceList title="次にやる練習" items={result.nextPractice} />
      <Card>
        <SectionTitle title="次の一言アドバイス" />
        <Text style={screenStyles.adviceText}>{result.advice}</Text>
      </Card>
    </View>
  );
}

function AdviceList({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <SectionTitle title={title} />
      <View style={{ gap: 9 }}>
        {items.map((item) => (
          <View key={item} style={screenStyles.listRow}>
            <View style={screenStyles.dot} />
            <Text style={screenStyles.listText}>{item}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const screenStyles = StyleSheet.create({
  adviceText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 23
  },
  centerPanel: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 22
  },
  description: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21
  },
  dot: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 7,
    marginTop: 8,
    width: 7
  },
  listRow: {
    flexDirection: "row",
    gap: 10
  },
  listText: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
    lineHeight: 22
  },
  mutedText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "700"
  }
});
