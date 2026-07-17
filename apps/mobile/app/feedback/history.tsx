import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { Text, View } from "react-native";
import { fetchMyFeedbacks } from "@/api/feedback";
import { Card, EmptyState, ErrorMessage, Header, LoadingState, MetaPill, Row, Screen, colors } from "@/components/ui";
import type { FeedbackCategory, FeedbackListItem, FeedbackStatus } from "@/types";

const categoryLabels: Record<FeedbackCategory, string> = {
  BUG: "不具合報告",
  USABILITY: "使いにくい点",
  FEATURE_REQUEST: "機能要望",
  SAFETY: "安全性・通報に関する意見",
  OTHER: "その他"
};

const statusLabels: Record<FeedbackStatus, string> = {
  OPEN: "未対応",
  REVIEWING: "確認中",
  RESOLVED: "対応済み",
  CLOSED: "対応終了"
};

export default function FeedbackHistoryScreen() {
  const [feedbacks, setFeedbacks] = useState<FeedbackListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchMyFeedbacks();
      setFeedbacks(result.feedbacks);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "送信履歴を取得できませんでした");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <Screen>
      <Header backLabel="戻る" onBack={() => router.back()} subtitle="自分が送信したフィードバックだけを表示します。" title="送信履歴" />
      <ErrorMessage actionLabel="再読み込み" message={error} onAction={load} />
      {loading ? <LoadingState /> : null}
      {!loading && feedbacks.length === 0 ? <EmptyState>まだフィードバックは送信していません。</EmptyState> : null}
      {feedbacks.map((feedback) => (
        <Card key={feedback.id}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <MetaPill label={categoryLabels[feedback.category]} />
            <MetaPill label={statusLabels[feedback.status]} tone={feedback.status === "OPEN" ? "green" : feedback.status === "CLOSED" ? "red" : "blue"} />
          </View>
          <Text style={{ color: colors.text, fontSize: 17, fontWeight: "900", lineHeight: 23 }}>{feedback.subject}</Text>
          <Row label="送信日時" value={formatDateTime(feedback.createdAt)} />
        </Card>
      ))}
    </Screen>
  );
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}
