import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { type Href, useFocusEffect, useRouter } from "expo-router";
import { fetchChatRooms } from "@/api/chat";
import { formatDateTime } from "@/components/format";
import { Button, Card, EmptyState, ErrorMessage, Header, LoadingState, Screen, colors } from "@/components/ui";
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
              <Card>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text numberOfLines={1} style={styles.name}>
                      {item.otherUser.name}
                    </Text>
                    <Text numberOfLines={1} style={styles.title}>
                      {item.partnerPostTitle}
                    </Text>
                  </View>
                  <Text style={styles.time}>
                    {item.latestMessage ? formatDateTime(item.latestMessage.createdAt) : formatDateTime(item.createdAt)}
                  </Text>
                </View>
                <Text numberOfLines={2} style={styles.preview}>
                  {item.latestMessage ? item.latestMessage.body : "まだメッセージはありません。"}
                </Text>
              </Card>
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
  cardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  name: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
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
  }
});
