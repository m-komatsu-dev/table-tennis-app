import { useCallback, useState } from "react";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import type { Href } from "expo-router";
import { Linking, Text, View } from "react-native";
import { fetchPartnerPost, fetchPartnerRequests, updatePartnerRequest } from "@/api/partner-posts";
import { formatDate, partnerRequestStatusLabels } from "@/components/format";
import { Button, Card, EmptyState, ErrorMessage, Header, LoadingState, MetaPill, Row, Screen, SectionTitle, colors } from "@/components/ui";
import type { PartnerPost, PartnerRequest, PartnerRequestStatus } from "@/types";

export default function PartnerRequestsScreen() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const postId = Array.isArray(id) ? id[0] : id;
  const [post, setPost] = useState<PartnerPost | null>(null);
  const [items, setItems] = useState<PartnerRequest[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!postId) {
      setError("募集が見つかりません");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [postResult, requestResult] = await Promise.all([
        fetchPartnerPost(postId),
        fetchPartnerRequests(postId)
      ]);
      setPost(postResult.partnerPost);
      setItems(requestResult.partnerRequests);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "参加希望を取得できませんでした");
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleStatusChange(requestId: string, status: PartnerRequestStatus) {
    setUpdatingId(requestId);
    setError(null);

    try {
      const result = await updatePartnerRequest(requestId, status);
      setItems((current) => current.map((item) => (item.id === requestId ? result.partnerRequest : item)));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "参加希望の状態を更新できませんでした");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <Screen>
      <Header backLabel="募集詳細へ戻る" onBack={() => router.replace(`/partner-posts/${postId}` as Href)} title="参加希望一覧" />
      <ErrorMessage actionLabel="再読み込み" message={error} onAction={load} />
      {loading ? <LoadingState /> : null}
      {!loading && post ? (
        <Card>
          <SectionTitle title={post.title} subtitle={`${items.length}件の参加希望`} />
        </Card>
      ) : null}
      {!loading && !error && items.length === 0 ? (
        <EmptyState>
          まだ参加希望はありません。{"\n"}募集内容を分かりやすく書くと、反応が届きやすくなります。
        </EmptyState>
      ) : null}
      {!loading && !error && items.map((item) => (
        <PartnerRequestCard
          key={item.id}
          item={item}
          onStatusChange={handleStatusChange}
          updating={updatingId === item.id}
        />
      ))}
    </Screen>
  );
}

function PartnerRequestCard({
  item,
  onStatusChange,
  updating
}: {
  item: PartnerRequest;
  onStatusChange: (requestId: string, status: PartnerRequestStatus) => void;
  updating: boolean;
}) {
  return (
    <Card>
      <View style={{ gap: 8 }}>
        <Text style={{ color: colors.text, fontSize: 17, fontWeight: "900", lineHeight: 23 }}>{item.requester.name}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <MetaPill label={partnerRequestStatusLabels[item.status]} tone={statusTone(item.status)} />
          <MetaPill label={formatDate(item.createdAt)} />
          {item.isRequesterBlocked ? <MetaPill label="ブロック済みユーザー" /> : null}
        </View>
      </View>
      <Row label="参加希望メッセージ" value={item.message} />
      <Row
        label="公開プロフィール"
        value={!item.isRequesterBlocked && item.requester.publicProfileEnabled && item.requester.username ? `@${item.requester.username}` : "非公開"}
      />
      <PublicProfileButton enabled={!item.isRequesterBlocked && item.requester.publicProfileEnabled} username={item.requester.username} />
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Button
            disabled={updating}
            loading={updating && item.status !== "ACCEPTED"}
            loadingLabel="更新中..."
            onPress={() => onStatusChange(item.id, "ACCEPTED")}
            variant="secondary"
          >
            承認
          </Button>
        </View>
        <View style={{ flex: 1 }}>
          <Button
            disabled={updating}
            loading={updating && item.status !== "DECLINED"}
            loadingLabel="更新中..."
            onPress={() => onStatusChange(item.id, "DECLINED")}
            variant="secondary"
          >
            見送り
          </Button>
        </View>
      </View>
    </Card>
  );
}

function statusTone(status: PartnerRequestStatus) {
  if (status === "ACCEPTED") {
    return "green";
  }

  if (status === "DECLINED") {
    return "red";
  }

  return "blue";
}

function PublicProfileButton({ enabled, username }: { enabled: boolean; username: string | null }) {
  if (!enabled || !username) {
    return null;
  }

  return (
    <Button variant="secondary" onPress={() => openPublicProfile(username)}>
      公開プロフィールを見る
    </Button>
  );
}

function openPublicProfile(username: string) {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");

  if (!baseUrl) {
    return;
  }

  Linking.openURL(`${baseUrl}/u/${username}`).catch(() => undefined);
}
