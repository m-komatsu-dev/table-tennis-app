import { useCallback, useState } from "react";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import type { Href } from "expo-router";
import { Alert, Linking, Text, View } from "react-native";
import { createPartnerRequest, deletePartnerPost, fetchPartnerPost, updatePartnerPost } from "@/api/partner-posts";
import { partnerPostStatusLabels, partnerPostTypeLabels, partnerRequestStatusLabels } from "@/components/format";
import { Button, Card, ErrorMessage, Header, LoadingState, MetaPill, Row, Screen, SectionTitle, TextField, colors } from "@/components/ui";
import type { PartnerPost } from "@/types";

export default function PartnerPostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const postId = Array.isArray(id) ? id[0] : id;
  const [item, setItem] = useState<PartnerPost | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingRequest, setSavingRequest] = useState(false);
  const [closing, setClosing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestNotice, setRequestNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!postId) {
      setError("募集が見つかりません");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchPartnerPost(postId);
      setItem(result.partnerPost);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "募集を取得できませんでした");
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleRequest() {
    if (!postId || savingRequest) {
      return;
    }

    if (requestMessage.trim().length > 300) {
      setError("参加希望メッセージは300文字以内で入力してください");
      return;
    }

    setSavingRequest(true);
    setError(null);
    setRequestNotice(null);

    try {
      await createPartnerRequest(postId, requestMessage.trim());
      setRequestMessage("");
      setRequestNotice("参加希望を送信しました。投稿者が確認できます。");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "参加希望を送信できませんでした");
    } finally {
      setSavingRequest(false);
    }
  }

  function confirmClose() {
    if (!item || closing || item.status === "CLOSED") {
      return;
    }

    Alert.alert("募集を締め切りますか？", "締め切ると新しい参加希望は送れなくなります。", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "締め切る",
        style: "destructive",
        onPress: async () => {
          setClosing(true);
          setError(null);

          try {
            const result = await updatePartnerPost(item.id, { ...toPartnerPostInput(item), status: "CLOSED" });
            setItem(result.partnerPost);
          } catch (caught) {
            setError(caught instanceof Error ? caught.message : "募集を締め切れませんでした");
          } finally {
            setClosing(false);
          }
        }
      }
    ]);
  }

  function confirmDelete() {
    if (!postId || deleting) {
      return;
    }

    Alert.alert("この募集を削除しますか？", "届いた参加希望も削除されます。この操作は取り消せません。", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          setDeleting(true);
          setError(null);

          try {
            await deletePartnerPost(postId);
            router.replace("/partner-posts" as Href);
          } catch (caught) {
            setError(caught instanceof Error ? caught.message : "募集を削除できませんでした");
            setDeleting(false);
          }
        }
      }
    ]);
  }

  return (
    <Screen keyboardAware>
      <Header backLabel="募集一覧へ戻る" onBack={() => router.replace("/partner-posts" as Href)} title="募集詳細" />
      <ErrorMessage actionLabel="再読み込み" message={error} onAction={load} />
      {loading ? <LoadingState /> : null}
      {!loading && item ? (
        <>
          <Card>
            <SectionTitle title={item.title} />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              <MetaPill label={partnerPostTypeLabels[item.type]} tone={item.type === "PRACTICE" ? "green" : "blue"} />
              <MetaPill label={partnerPostStatusLabels[item.status]} tone={item.status === "OPEN" ? "green" : "red"} />
            </View>
            <Row label="エリア" value={item.area} />
            <Row label="希望日時" value={item.preferredTime} />
            <Row label="レベル" value={item.level} />
            <Row label="目的" value={item.purpose} />
            <Row label="募集メッセージ" value={item.message} />
          </Card>

          <Card>
            <SectionTitle title="投稿者" />
            <Row label="表示名" value={item.owner.name} />
            <Row label="公開プロフィール" value={item.owner.publicProfileEnabled && item.owner.username ? `@${item.owner.username}` : "非公開"} />
            <PublicProfileButton enabled={item.owner.publicProfileEnabled} username={item.owner.username} />
          </Card>

          {requestNotice ? (
            <Card>
              <Text style={{ color: colors.primaryDark, fontSize: 14, fontWeight: "800", lineHeight: 21 }}>{requestNotice}</Text>
            </Card>
          ) : null}

          {item.isOwner ? (
            <OwnerActions item={item} closing={closing} deleting={deleting} onClose={confirmClose} onDelete={confirmDelete} />
          ) : (
            <RequestForm
              disabled={item.status !== "OPEN" || Boolean(item.ownRequestStatus)}
              message={requestMessage}
              onChangeMessage={setRequestMessage}
              onSubmit={handleRequest}
              saving={savingRequest}
              status={item.ownRequestStatus}
            />
          )}
        </>
      ) : null}
    </Screen>
  );
}

function OwnerActions({
  closing,
  deleting,
  item,
  onClose,
  onDelete
}: {
  closing: boolean;
  deleting: boolean;
  item: PartnerPost;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={{ gap: 10 }}>
      <Button onPress={() => router.push(`/partner-posts/${item.id}/edit` as Href)}>編集</Button>
      <Button disabled={item.status === "CLOSED"} loading={closing} loadingLabel="締め切り中..." onPress={onClose} variant="secondary">
        {item.status === "CLOSED" ? "締め切り済み" : "募集を締め切る"}
      </Button>
      <Button onPress={() => router.push(`/partner-posts/${item.id}/requests` as Href)} variant="secondary">
        参加希望一覧を見る
      </Button>
      <Button loading={deleting} loadingLabel="削除中..." onPress={onDelete} variant="danger">
        削除
      </Button>
    </View>
  );
}

function RequestForm({
  disabled,
  message,
  onChangeMessage,
  onSubmit,
  saving,
  status
}: {
  disabled: boolean;
  message: string;
  onChangeMessage: (value: string) => void;
  onSubmit: () => void;
  saving: boolean;
  status: PartnerPost["ownRequestStatus"];
}) {
  if (status) {
    return (
      <Card>
        <SectionTitle title="参加希望" />
        <MetaPill label={`送信済み: ${partnerRequestStatusLabels[status]}`} tone="blue" />
        <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21 }}>投稿者が参加希望を確認できます。チャット機能はありません。</Text>
      </Card>
    );
  }

  return (
    <Card>
      <SectionTitle title="参加希望" subtitle="安全のため、住所・電話番号・メールアドレスなどの個人情報は書かないでください。" />
      <TextField
        editable={!disabled}
        label="メッセージ"
        maxLength={300}
        multiline
        onChangeText={onChangeMessage}
        placeholder="こんにちは。バックハンド練習をしたいので参加希望です。"
        value={message}
      />
      <Button disabled={disabled} loading={saving} loadingLabel="送信中..." onPress={onSubmit}>
        {disabled ? "参加希望できません" : "参加希望を送る"}
      </Button>
    </Card>
  );
}

function toPartnerPostInput(item: PartnerPost) {
  return {
    type: item.type,
    title: item.title,
    area: item.area ?? "",
    preferredTime: item.preferredTime ?? "",
    level: item.level ?? "",
    purpose: item.purpose ?? "",
    message: item.message ?? "",
    status: item.status
  };
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
