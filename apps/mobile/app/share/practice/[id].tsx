import * as Clipboard from "expo-clipboard";
import { useCallback, useMemo, useState } from "react";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { fetchPracticeLog } from "@/api/practice";
import { formatDate } from "@/components/format";
import { Button, Card, ErrorMessage, Header, LoadingState, Row, Screen, SectionTitle, colors } from "@/components/ui";
import type { PracticeLog } from "@/types";
import { buildPracticeShareText, shareTags, shortenShareText } from "@/utils/share";

export default function PracticeShareScreen() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const practiceId = Array.isArray(id) ? id[0] : id;
  const [practice, setPractice] = useState<PracticeLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    if (!practiceId) {
      setError("練習記録が見つかりません");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchPracticeLog(practiceId);
      setPractice(result.practiceLog);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "共有カードを作成できませんでした");
    } finally {
      setLoading(false);
    }
  }, [practiceId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const shareText = useMemo(() => (practice ? buildPracticeShareText(practice) : ""), [practice]);

  async function copyText() {
    await Clipboard.setStringAsync(shareText);
    setCopied(true);
  }

  return (
    <Screen>
      <Header backLabel="詳細へ戻る" onBack={() => router.back()} title="練習記録を共有" />
      <ErrorMessage actionLabel="再読み込み" message={error} onAction={load} />
      {loading ? <LoadingState /> : null}
      {!loading && practice ? (
        <>
          <View style={shareStyles.card}>
            <Text style={shareStyles.kicker}>今日の練習記録</Text>
            <Text style={shareStyles.title}>{practice.practiceMenu?.title ?? practice.content ?? "卓球練習"}</Text>
            <View style={shareStyles.metricRow}>
              <View style={shareStyles.metric}>
                <Text style={shareStyles.metricValue}>{practice.durationMin}</Text>
                <Text style={shareStyles.metricLabel}>分</Text>
              </View>
              <View style={shareStyles.metric}>
                <Text style={shareStyles.metricValue}>{formatDate(practice.practicedAt)}</Text>
                <Text style={shareStyles.metricLabel}>練習日</Text>
              </View>
            </View>
            <View style={shareStyles.divider} />
            <Row label="練習内容" value={practice.content} />
            <Row label="練習メニュー" value={practice.practiceMenu?.title} />
            <Row label="メモ" value={shortenShareText(practice.memo, 96)} />
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
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 31
  },
  metricRow: {
    flexDirection: "row",
    gap: 10
  },
  metric: {
    backgroundColor: "#ecfdf5",
    borderRadius: 14,
    flex: 1,
    padding: 14
  },
  metricValue: {
    color: colors.primaryDark,
    fontSize: 22,
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
