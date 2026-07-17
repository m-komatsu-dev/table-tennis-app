import { useCallback, useMemo, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { deleteAccount, fetchAccountDeletionStatus, type AccountDeletionStatus } from "@/api/profile";
import { Button, Card, ErrorMessage, Header, LoadingState, Screen, TextField, colors, styles } from "@/components/ui";
import { clearAccessToken } from "@/storage/token";

const confirmationText = "アカウントを削除";

const deletionNotes = [
  "この操作は原則として取り消せません。",
  "プロフィール、練習、試合、用具などが削除されます。",
  "募集、参加希望、チャット、通知も削除されます。",
  "公開プロフィールも閲覧できなくなります。",
  "削除後は同じアカウントへログインできません。",
  "同じメールアドレスで将来再登録できる可能性がありますが、以前のデータは復元されません。",
  "バックアップやログには一定期間残る可能性があります。",
  "Googleアカウントそのものは削除されません。",
  "Table Tennis Logとの連携情報だけが削除対象です。"
] as const;

export default function AccountDeleteScreen() {
  const [status, setStatus] = useState<AccountDeletionStatus | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [typedConfirmation, setTypedConfirmation] = useState("");
  const [confirmedIrreversible, setConfirmedIrreversible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setStatus(await fetchAccountDeletionStatus());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "アカウント削除の状態を確認できませんでした");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const requiresPassword = status?.authMethod === "password";
  const requiresGoogleReauth = status?.authMethod === "google" && !status.isGoogleReauthenticated;
  const canSubmit = useMemo(
    () =>
      Boolean(status) &&
      status?.authMethod !== "unsupported" &&
      !requiresGoogleReauth &&
      typedConfirmation === confirmationText &&
      confirmedIrreversible &&
      (!requiresPassword || currentPassword.length > 0) &&
      !submitting,
    [confirmedIrreversible, currentPassword.length, requiresGoogleReauth, requiresPassword, status, submitting, typedConfirmation]
  );

  async function handleDelete() {
    if (!canSubmit) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await deleteAccount({
        ...(requiresPassword ? { currentPassword } : {}),
        confirmationText: typedConfirmation,
        confirmedIrreversible
      });
      await clearAccessToken();
      router.replace("/login");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "アカウントを削除できませんでした。時間をおいて再度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRelogin() {
    await clearAccessToken();
    router.replace("/login");
  }

  return (
    <Screen keyboardAware>
      <Header title="アカウント削除" subtitle="本人確認後、アカウントと関連データを削除します。" onBack={() => router.back()} />
      <ErrorMessage message={error} actionLabel="再読み込み" onAction={load} />
      {loading ? <LoadingState /> : null}
      {status ? (
        <>
          <Card>
            <Text style={{ color: colors.danger, fontSize: 18, fontWeight: "900" }}>削除される内容</Text>
            <View style={{ gap: 8 }}>
              {deletionNotes.map((note) => (
                <Text key={note} style={{ color: colors.text, fontSize: 14, lineHeight: 21 }}>
                  ・{note}
                </Text>
              ))}
            </View>
          </Card>

          {status.authMethod === "unsupported" ? (
            <Card>
              <Text style={{ color: colors.text, fontSize: 14, lineHeight: 21 }}>
                このアカウントでは安全な本人確認方法を確認できません。時間をおいて再度ログインしてください。
              </Text>
            </Card>
          ) : null}

          {requiresGoogleReauth ? (
            <Card>
              <Text style={{ color: colors.text, fontSize: 15, fontWeight: "900", lineHeight: 22 }}>
                Googleログインユーザーは削除前にもう一度ログインしてください。
              </Text>
              <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21 }}>
                再ログインから10分以内だけ削除できます。
              </Text>
              <Button variant="secondary" onPress={handleRelogin}>
                ログインし直す
              </Button>
            </Card>
          ) : null}

          <Card>
            {requiresPassword ? (
              <TextField
                autoCapitalize="none"
                label="現在のパスワード"
                onChangeText={setCurrentPassword}
                secureTextEntry
                value={currentPassword}
              />
            ) : null}
            <TextField
              autoCapitalize="none"
              label="確認文言"
              onChangeText={setTypedConfirmation}
              placeholder={confirmationText}
              value={typedConfirmation}
            />
            <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18 }}>
              「{confirmationText}」と完全一致で入力してください。
            </Text>
            <Pressable
              onPress={() => setConfirmedIrreversible((current) => !current)}
              style={{
                alignItems: "center",
                borderColor: confirmedIrreversible ? "#fecaca" : colors.border,
                borderRadius: 8,
                borderWidth: 1,
                flexDirection: "row",
                gap: 10,
                minHeight: 48,
                padding: 12
              }}
            >
              <View
                style={{
                  alignItems: "center",
                  backgroundColor: confirmedIrreversible ? colors.danger : colors.surface,
                  borderColor: confirmedIrreversible ? colors.danger : colors.border,
                  borderRadius: 4,
                  borderWidth: 1,
                  height: 20,
                  justifyContent: "center",
                  width: 20
                }}
              >
                {confirmedIrreversible ? <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "900" }}>✓</Text> : null}
              </View>
              <Text style={{ color: colors.text, flex: 1, fontSize: 14, fontWeight: "800", lineHeight: 20 }}>
                この操作が原則として復元できないことを理解しました。
              </Text>
            </Pressable>
            <Button disabled={!canSubmit} loading={submitting} loadingLabel="削除中..." onPress={handleDelete} variant="danger">
              アカウントを完全に削除
            </Button>
          </Card>
        </>
      ) : null}
      <Pressable onPress={() => router.back()} style={{ alignItems: "center", minHeight: 44, justifyContent: "center" }}>
        <Text style={[styles.backButtonText, { color: colors.primaryDark }]}>戻る</Text>
      </Pressable>
    </Screen>
  );
}
