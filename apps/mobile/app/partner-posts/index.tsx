import { useCallback, useMemo, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import type { Href } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { fetchPartnerPosts } from "@/api/partner-posts";
import { partnerPostStatusLabels, partnerPostTypeLabels } from "@/components/format";
import { Button, Card, EmptyState, ErrorMessage, Header, LoadingState, MetaPill, Row, Screen, Segment, colors, styles } from "@/components/ui";
import type { PartnerPost } from "@/types";

type PartnerPostFilter = "all" | "practice" | "match" | "open";

export default function PartnerPostListScreen() {
  const [items, setItems] = useState<PartnerPost[]>([]);
  const [filter, setFilter] = useState<PartnerPostFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchPartnerPosts();
      setItems(result.partnerPosts);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "募集を取得できませんでした");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filteredItems = useMemo(() => {
    if (filter === "practice") {
      return items.filter((item) => item.type === "PRACTICE");
    }

    if (filter === "match") {
      return items.filter((item) => item.type === "MATCH");
    }

    if (filter === "open") {
      return items.filter((item) => item.status === "OPEN");
    }

    return items;
  }, [filter, items]);

  return (
    <Screen>
      <Header
        action={
          <Pressable onPress={() => router.push("/partner-posts/new" as Href)} style={styles.listAddButton}>
            <Text style={styles.buttonText}>作成</Text>
          </Pressable>
        }
        subtitle={`${items.length}件`}
        title="募集"
      />
      <ErrorMessage actionLabel="再読み込み" message={error} onAction={load} />
      {loading ? <LoadingState /> : null}
      {!loading && !error ? (
        <Segment
          onChange={setFilter}
          options={[
            { label: "すべて", value: "all" },
            { label: "練習相手", value: "practice" },
            { label: "試合相手", value: "match" },
            { label: "募集中のみ", value: "open" }
          ]}
          value={filter}
        />
      ) : null}
      {!loading && !error && items.length === 0 ? (
        <EmptyState actionLabel="募集を作成する" onAction={() => router.push("/partner-posts/new" as Href)}>
          現在、募集はありません。{"\n"}練習相手や試合相手を募集してみましょう。
        </EmptyState>
      ) : null}
      {!loading && !error && items.length > 0 && filteredItems.length === 0 ? (
        <EmptyState>条件に一致する募集はありません。</EmptyState>
      ) : null}
      {!loading && !error && filteredItems.map((item) => <PartnerPostCard key={item.id} item={item} />)}
      <Button variant="secondary" onPress={() => router.push("/(tabs)/home")}>
        ホームへ戻る
      </Button>
    </Screen>
  );
}

function PartnerPostCard({ item }: { item: PartnerPost }) {
  return (
    <Pressable onPress={() => router.push(`/partner-posts/${item.id}` as Href)}>
      <Card>
        <View style={{ gap: 8 }}>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: "900", lineHeight: 24 }}>{item.title}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <MetaPill label={partnerPostTypeLabels[item.type]} tone={item.type === "PRACTICE" ? "green" : "blue"} />
            <MetaPill label={partnerPostStatusLabels[item.status]} tone={item.status === "OPEN" ? "green" : "red"} />
            {item.ownRequestStatus ? <MetaPill label="参加希望済み" tone="blue" /> : null}
          </View>
        </View>
        <Row label="エリア" value={item.area} />
        <Row label="希望日時" value={item.preferredTime} />
        <Row label="レベル" value={item.level} />
        <Row label="目的" value={item.purpose} />
        <Row label="投稿者" value={item.owner.name} />
      </Card>
    </Pressable>
  );
}
