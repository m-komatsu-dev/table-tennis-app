import * as Clipboard from "expo-clipboard";
import { useCallback, useMemo, useState } from "react";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { StyleSheet, Switch, Text, View } from "react-native";
import { fetchMatchRecord } from "@/api/match";
import { formatDate, formatScores, matchTypeLabels, resultLabels } from "@/components/format";
import { Button, Card, ErrorMessage, Header, LoadingState, Row, Screen, SectionTitle, colors } from "@/components/ui";
import type { MatchRecord } from "@/types";
import { buildMatchShareText, matchShareTags, shortenShareText } from "@/utils/share";

export default function MatchShareScreen() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const matchId = Array.isArray(id) ? id[0] : id;
  const [match, setMatch] = useState<MatchRecord | null>(null);
  const [includeOpponentName, setIncludeOpponentName] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    if (!matchId) {
      setError("試合記録が見つかりません");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchMatchRecord(matchId);
      setMatch(result.matchRecord);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "共有カードを作成できませんでした");
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const shareText = useMemo(() => (match ? buildMatchShareText(match, includeOpponentName) : ""), [includeOpponentName, match]);

  async function copyText() {
    await Clipboard.setStringAsync(shareText);
    setCopied(true);
  }

  return (
    <Screen>
      <Header backLabel="詳細へ戻る" onBack={() => router.back()} title="試合記録を共有" />
      <ErrorMessage actionLabel="再読み込み" message={error} onAction={load} />
      {loading ? <LoadingState /> : null}
      {!loading && match ? (
        <>
          <View style={shareStyles.card}>
            <Text style={shareStyles.kicker}>今日の試合記録</Text>
            <Text style={shareStyles.title}>{resultLabels[match.result]}</Text>
            <View style={shareStyles.metricRow}>
              <View style={shareStyles.metric}>
                <Text style={shareStyles.metricValue}>{formatScores(match.scores) || "-"}</Text>
                <Text style={shareStyles.metricLabel}>スコア</Text>
              </View>
              <View style={shareStyles.metric}>
                <Text style={shareStyles.metricValue}>{formatDate(match.playedAt)}</Text>
                <Text style={shareStyles.metricLabel}>試合日</Text>
              </View>
            </View>
            <View style={shareStyles.divider} />
            <Row label="勝敗" value={resultLabels[match.result]} />
            <Row label="試合種別" value={matchTypeLabels[match.matchType]} />
            <Row label="メモ" value={shortenShareText(match.memo, 96)} />
            <Text style={shareStyles.tags}>{matchShareTags}</Text>
          </View>

          <Card>
            <SectionTitle title="共有時のプライバシー" subtitle="対戦相手名はデフォルトでは投稿文に出しません。" />
            <View style={shareStyles.switchRow}>
              <Text style={shareStyles.switchText}>投稿文に対戦相手名を含める</Text>
              <Switch
                onValueChange={setIncludeOpponentName}
                thumbColor="#ffffff"
                trackColor={{ false: "#cbd5e1", true: "#34d399" }}
                value={includeOpponentName}
              />
            </View>
          </Card>

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
    fontSize: 28,
    fontWeight: "900"
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
    fontSize: 19,
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
  switchRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  switchText: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
    fontWeight: "800"
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
