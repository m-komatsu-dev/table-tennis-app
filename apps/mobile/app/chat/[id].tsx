import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View, type AlertButton } from "react-native";
import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import { fetchChatRoom, sendChatMessage } from "@/api/chat";
import { createReport } from "@/api/safety";
import { formatDateTime } from "@/components/format";
import { Button, Card, ErrorMessage, Header, LoadingState, Screen, TextField, colors } from "@/components/ui";
import type { ChatMessage, ChatRoom, ReportReason } from "@/types";

const reportReasonLabels: Record<ReportReason, string> = {
  SPAM: "スパム",
  HARASSMENT: "迷惑行為",
  INAPPROPRIATE: "不適切な内容",
  PERSONAL_INFORMATION: "個人情報が含まれている",
  FAKE_INFORMATION: "虚偽の情報",
  OTHER: "その他"
};

export default function ChatDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<(ChatRoom & { messages: ChatMessage[] }) | null>(null);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      return;
    }

    setError(null);

    try {
      const result = await fetchChatRoom(id);
      setItem(result.chatRoom);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "チャットを読み込めませんでした。");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSend() {
    if (!id || sending) {
      return;
    }

    const trimmed = body.trim();

    if (trimmed.length === 0) {
      setError("メッセージを入力してください。");
      return;
    }

    setSending(true);
    setError(null);

    try {
      await sendChatMessage(id, trimmed);
      setBody("");
      await load();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "メッセージを送信できませんでした。");
    } finally {
      setSending(false);
    }
  }

  async function handleReport(messageId: string, reason: ReportReason) {
    try {
      await createReport({ targetType: "CHAT_MESSAGE", targetMessageId: messageId, reason });
      Alert.alert("通報を受け付けました", "内容を確認します。");
    } catch (reportError) {
      Alert.alert("通報を送信できませんでした", reportError instanceof Error ? reportError.message : "通信状況を確認して、もう一度お試しください。");
    }
  }

  function openReportDialog(messageId: string) {
    const buttons: AlertButton[] = (Object.entries(reportReasonLabels) as [ReportReason, string][]).map(([reason, label]) => ({
      text: label,
      onPress: () => {
        void handleReport(messageId, reason);
      }
    }));

    buttons.push({ text: "キャンセル", style: "cancel" });

    Alert.alert(
      "メッセージを通報",
      "通報理由を選んでください。",
      buttons
    );
  }

  return (
    <Screen keyboardAware>
      <Header backLabel="チャット一覧へ戻る" onBack={() => router.replace("/chat" as Href)} subtitle={item?.partnerPostTitle} title={item?.otherUser.name ?? "チャット"} />
      <ErrorMessage actionLabel="再読み込み" message={error} onAction={load} title="チャットを読み込めませんでした。" />
      {loading ? (
        <LoadingState />
      ) : item ? (
        <>
          {item.isInteractionBlocked ? <ErrorMessage message="このユーザーとは現在やり取りできません。" title="送信できません" /> : null}
          <Card>
            <View style={{ gap: 14 }}>
              {item.messages.length === 0 ? (
                <Text style={styles.emptyMessage}>まだメッセージはありません。</Text>
              ) : (
                item.messages.map((message) => (
                  <View key={message.id} style={[styles.messageRow, message.isMine ? styles.myRow : styles.otherRow]}>
                    <View style={[styles.bubble, message.isMine ? styles.myBubble : styles.otherBubble]}>
                      <Text style={[styles.messageText, message.isMine && styles.myMessageText]}>{message.body}</Text>
                    </View>
                    <View style={[styles.metaRow, message.isMine ? styles.myRow : styles.otherRow]}>
                      <Text style={styles.metaText}>{message.isMine ? "自分" : message.sender.name}</Text>
                      <Text style={styles.metaText}>{formatDateTime(message.createdAt)}</Text>
                      {!message.isMine ? (
                        <Pressable onPress={() => openReportDialog(message.id)}>
                          <Text style={styles.reportText}>通報</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                ))
              )}
            </View>
          </Card>
          <Card>
            <TextField
              editable={!item.isInteractionBlocked && !sending}
              label="メッセージ"
              maxLength={1000}
              multiline
              onChangeText={setBody}
              placeholder={item.isInteractionBlocked ? "このユーザーとは現在やり取りできません。" : "日程や練習内容を相談しましょう。"}
              value={body}
            />
            <Button disabled={Boolean(item.isInteractionBlocked)} loading={sending} loadingLabel="送信中..." onPress={handleSend}>
              送信
            </Button>
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  bubble: {
    borderRadius: 18,
    maxWidth: "88%",
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  emptyMessage: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center"
  },
  messageRow: {
    gap: 6
  },
  messageText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 24
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  metaText: {
    color: colors.faint,
    fontSize: 11,
    fontWeight: "700"
  },
  myBubble: {
    alignSelf: "flex-end",
    backgroundColor: colors.primary
  },
  myMessageText: {
    color: "#ffffff"
  },
  myRow: {
    alignItems: "flex-end"
  },
  otherBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#f1f5f9",
    borderColor: colors.border,
    borderWidth: 1
  },
  otherRow: {
    alignItems: "flex-start"
  },
  reportText: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: "900"
  }
});
