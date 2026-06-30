import { useCallback, useState } from "react";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import type { Href } from "expo-router";
import { Alert, Linking, Pressable, Text, View } from "react-native";
import { createPartnerRequest, deletePartnerPost, fetchPartnerPost, updatePartnerPost } from "@/api/partner-posts";
import { blockUser, createReport, unblockUser } from "@/api/safety";
import { partnerPostStatusLabels, partnerPostTypeLabels, partnerRequestStatusLabels } from "@/components/format";
import { Button, Card, ErrorMessage, Header, LoadingState, MetaPill, Row, Screen, SectionTitle, TextField, colors } from "@/components/ui";
import type { PartnerPost, ReportReason, ReportTargetType } from "@/types";

export default function PartnerPostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const postId = Array.isArray(id) ? id[0] : id;
  const [item, setItem] = useState<PartnerPost | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingRequest, setSavingRequest] = useState(false);
  const [closing, setClosing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestNotice, setRequestNotice] = useState<string | null>(null);
  const [safetyNotice, setSafetyNotice] = useState<string | null>(null);

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

  async function handleBlock() {
    if (!item || blocking) {
      return;
    }

    setBlocking(true);
    setError(null);
    setSafetyNotice(null);

    try {
      if (item.isBlockedByMe) {
        await unblockUser(item.ownerId);
        setSafetyNotice("ブロックを解除しました。");
      } else {
        await blockUser(item.ownerId);
        setSafetyNotice("このユーザーをブロックしました。");
      }
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "ブロックできませんでした。通信状況を確認して、もう一度お試しください。");
    } finally {
      setBlocking(false);
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
            {item.isBlockedByMe ? <MetaPill label="このユーザーをブロックしています。" /> : null}
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
              isInteractionBlocked={item.isInteractionBlocked}
              message={requestMessage}
              onChangeMessage={setRequestMessage}
              onSubmit={handleRequest}
              saving={savingRequest}
              status={item.ownRequestStatus}
            />
          )}
          {!item.isOwner ? (
            <SafetyActions
              blockedByMe={item.isBlockedByMe}
              blocking={blocking}
              onBlockToggle={handleBlock}
              onNotice={setSafetyNotice}
              ownerId={item.ownerId}
              postId={item.id}
            />
          ) : null}
          {safetyNotice ? (
            <Card>
              <Text style={{ color: colors.primaryDark, fontSize: 14, fontWeight: "800", lineHeight: 21 }}>{safetyNotice}</Text>
            </Card>
          ) : null}
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
  isInteractionBlocked,
  message,
  onChangeMessage,
  onSubmit,
  saving,
  status
}: {
  disabled: boolean;
  isInteractionBlocked: boolean;
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

  if (isInteractionBlocked) {
    return (
      <Card>
        <SectionTitle title="参加希望" />
        <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21 }}>このユーザーとは現在やり取りできません。</Text>
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

function SafetyActions({
  blockedByMe,
  blocking,
  onBlockToggle,
  onNotice,
  ownerId,
  postId
}: {
  blockedByMe: boolean;
  blocking: boolean;
  onBlockToggle: () => void;
  onNotice: (message: string | null) => void;
  ownerId: string;
  postId: string;
}) {
  return (
    <Card>
      <SectionTitle title="安全メニュー" />
      <ReportBox
        label="この募集を通報"
        onNotice={onNotice}
        targetPostId={postId}
        targetType="PARTNER_POST"
      />
      <ReportBox
        label="このユーザーを通報"
        onNotice={onNotice}
        targetType="USER"
        targetUserId={ownerId}
      />
      <Button loading={blocking} loadingLabel="処理中..." onPress={onBlockToggle} variant={blockedByMe ? "secondary" : "danger"}>
        {blockedByMe ? "ブロック解除" : "このユーザーをブロック"}
      </Button>
    </Card>
  );
}

function ReportBox({
  label,
  onNotice,
  targetPostId,
  targetType,
  targetUserId
}: {
  label: string;
  onNotice: (message: string | null) => void;
  targetPostId?: string;
  targetType: ReportTargetType;
  targetUserId?: string;
}) {
  const [reason, setReason] = useState<ReportReason>("INAPPROPRIATE");
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);

  async function submit() {
    if (details.trim().length > 500) {
      Alert.alert("詳細は500文字以内で入力してください");
      return;
    }

    setSending(true);
    onNotice(null);

    try {
      const result = await createReport({
        targetType,
        targetUserId,
        targetPostId,
        reason,
        details: details.trim()
      });
      setDetails("");
      onNotice(result.message);
    } catch {
      Alert.alert("通報を送信できませんでした。", "通信状況を確認して、もう一度お試しください。");
    } finally {
      setSending(false);
    }
  }

  return (
    <View style={{ borderTopColor: colors.border, borderTopWidth: 1, gap: 10, paddingTop: 12 }}>
      <Text style={{ color: colors.text, fontSize: 14, fontWeight: "800" }}>{label}</Text>
      <ReasonSelect value={reason} onChange={setReason} />
      <TextField
        label="詳細"
        maxLength={500}
        multiline
        onChangeText={setDetails}
        placeholder="任意で入力してください"
        value={details}
      />
      <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18 }}>緊急の場合は、アプリ外の適切な窓口にも相談してください。</Text>
      <Button loading={sending} loadingLabel="送信中..." onPress={submit} variant="secondary">
        {label}
      </Button>
    </View>
  );
}

const reportReasonLabels: Record<ReportReason, string> = {
  SPAM: "スパム",
  HARASSMENT: "迷惑行為",
  INAPPROPRIATE: "不適切な内容",
  PERSONAL_INFORMATION: "個人情報が含まれている",
  FAKE_INFORMATION: "虚偽の情報",
  OTHER: "その他"
};

const reportReasons = Object.entries(reportReasonLabels) as [ReportReason, string][];

function ReasonSelect({ value, onChange }: { value: ReportReason; onChange: (value: ReportReason) => void }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {reportReasons.map(([reason, label]) => {
        const selected = reason === value;
        return (
          <Pressable
            key={reason}
            onPress={() => onChange(reason)}
            style={{
              backgroundColor: selected ? "#ecfdf5" : "#ffffff",
              borderColor: selected ? "#a7f3d0" : colors.border,
              borderRadius: 8,
              borderWidth: 1,
              minHeight: 36,
              justifyContent: "center",
              paddingHorizontal: 10,
              paddingVertical: 8
            }}
          >
            <Text style={{ color: selected ? colors.primaryDark : colors.muted, fontSize: 12, fontWeight: "800" }}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
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
