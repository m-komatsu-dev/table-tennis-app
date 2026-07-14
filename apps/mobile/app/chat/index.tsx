import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { type Href, useFocusEffect, useRouter } from "expo-router";
import { fetchChatRooms } from "@/api/chat";
import { formatDateTime } from "@/components/format";
import { Button, EmptyState, ErrorMessage, Header, LoadingState, Screen, colors } from "@/components/ui";
import type { ChatRoom } from "@/types";

export default function ChatListScreen() {
  const router = useRouter();
  const [items, setItems] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);

    try {
      const result = await fetchChatRooms();
      setItems(result.chatRooms);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "チャットを読み込めませんでした。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  return (
    <Screen>
      <Header backLabel="ホームへ戻る" onBack={() => router.replace("/(tabs)/home" as Href)} title="チャット" />
      <ErrorMessage actionLabel="再読み込み" message={error} onAction={load} title="チャットを読み込めませんでした。" />
      {loading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState actionLabel="募集を見る" onAction={() => router.push("/partner-posts" as Href)}>
          まだチャットはありません。参加希望が承認されると、ここにチャットが表示されます。
        </EmptyState>
      ) : (
        <View style={{ gap: 12 }}>
          {items.map((item) => (
            <Pressable key={item.id} onPress={() => router.push(`/chat/${item.id}` as Href)}>
              <View style={[styles.card, item.unreadCount > 0 && styles.unreadCard]}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1, gap: 6 }}>
                    <View style={styles.nameRow}>
                      <Text numberOfLines={1} style={[styles.name, item.unreadCount > 0 && styles.unreadName]}>
                        {item.otherUser.name}
                      </Text>
                      {item.unreadCount > 0 ? (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadBadgeText}>未読 {item.unreadCount}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text numberOfLines={1} style={styles.title}>
                      {item.partnerPostTitle}
                    </Text>
                  </View>
                  <Text style={styles.time}>
                    {item.lastMessage ? formatDateTime(item.lastMessage.createdAt) : formatDateTime(item.updatedAt)}
                  </Text>
                </View>
                <Text numberOfLines={2} style={[styles.preview, item.unreadCount > 0 && styles.unreadPreview]}>
                  {item.lastMessage ? item.lastMessage.body : "まだメッセージはありません。"}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
      <Button onPress={() => router.push("/partner-posts" as Href)} variant="secondary">
        募集を見る
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 16,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12
  },
  cardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  name: {
    color: colors.text,
    fontSize: 18,
    flexShrink: 1,
    fontWeight: "900"
  },
  nameRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  preview: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12
  },
  time: {
    color: colors.faint,
    fontSize: 11,
    fontWeight: "800",
    maxWidth: 108,
    textAlign: "right"
  },
  title: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "800"
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4
  },
  unreadBadgeText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "900"
  },
  unreadCard: {
    backgroundColor: "#ecfdf5",
    borderColor: "#a7f3d0"
  },
  unreadName: {
    color: colors.text
  },
  unreadPreview: {
    color: colors.text,
    fontWeight: "800"
  }
});
