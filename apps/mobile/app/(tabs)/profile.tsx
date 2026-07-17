import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import type { Href } from "expo-router";
import { fetchProfile } from "@/api/profile";
import { fetchBlocks, unblockUser } from "@/api/safety";
import { genderLabels, levelLabels } from "@/components/format";
import { Button, Card, EmptyState, ErrorMessage, Header, LoadingState, Row, Screen, SectionTitle, colors } from "@/components/ui";
import { clearAccessToken } from "@/storage/token";
import type { User, UserBlock } from "@/types";
import { Text, View } from "react-native";

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [blocks, setBlocks] = useState<UserBlock[]>([]);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileResult, blockResult] = await Promise.all([fetchProfile(), fetchBlocks()]);
      setUser(profileResult.user);
      setBlocks(blockResult.blocks);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "プロフィールを取得できませんでした");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleLogout() {
    await clearAccessToken();
    router.replace("/");
  }

  async function handleUnblock(blockedUserId: string) {
    setUnblockingId(blockedUserId);
    setError(null);

    try {
      await unblockUser(blockedUserId);
      setBlocks((current) => current.filter((block) => block.blockedUserId !== blockedUserId));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "ブロック解除できませんでした");
    } finally {
      setUnblockingId(null);
    }
  }

  return (
    <Screen>
      <Header subtitle="Web版と同じアカウント情報です。" title="プロフィール" />
      <ErrorMessage actionLabel="再読み込み" message={error} onAction={load} />
      {loading ? <LoadingState /> : null}
      {user ? (
        <Card>
          <Row label="ユーザー名" value={user.name} />
          <Row label="メールアドレス" value={user.email} />
          <Row label="レベル" value={user.level ? levelLabels[user.level] : null} />
          <Row label="性別" value={user.gender ? genderLabels[user.gender] : null} />
          <Row label="所属" value={user.club} />
          <Row label="プレースタイル" value={user.playStyle} />
          <Button variant="secondary" onPress={() => router.push("/profile/edit" as Href)}>
            編集
          </Button>
        </Card>
      ) : null}
      {user ? (
        <Card>
          <SectionTitle
            title="公開プロフィール"
            subtitle="練習の成果を共有できるプロフィールページです。公開プロフィールは設定をONにした場合のみ表示されます。"
          />
          <Row label="状態" value={user.publicProfileEnabled ? "公開中" : "非公開"} />
          <Row label="公開ユーザー名" value={user.username} />
          <Button variant="secondary" onPress={() => router.push("/profile/edit" as Href)}>
            公開プロフィール設定
          </Button>
        </Card>
      ) : null}
      {user ? (
        <Card>
          <SectionTitle
            title="募集"
            subtitle="練習相手・試合相手の募集を作成し、届いた参加希望を確認できます。"
          />
          <Button variant="secondary" onPress={() => router.push("/partner-posts" as Href)}>
            募集を見る
          </Button>
          <Button variant="secondary" onPress={() => router.push("/partner-posts/new" as Href)}>
            募集を作成する
          </Button>
          <Button variant="secondary" onPress={() => router.push("/chat" as Href)}>
            チャット
          </Button>
        </Card>
      ) : null}
      {user ? (
        <Card>
          <SectionTitle
            title="ご意見・不具合報告"
            subtitle="β版へのフィードバックを送信し、自分の送信履歴を確認できます。"
          />
          <Button variant="secondary" onPress={() => router.push("/feedback" as Href)}>
            フィードバックを送る
          </Button>
          <Button variant="secondary" onPress={() => router.push("/feedback/history" as Href)}>
            送信履歴を見る
          </Button>
        </Card>
      ) : null}
      {user ? (
        <Card>
          <SectionTitle
            title="安全設定"
            subtitle="ブロック中のユーザーは募集や参加希望が制限されます。"
          />
          {blocks.length === 0 ? (
            <EmptyState>ブロック中のユーザーはいません。</EmptyState>
          ) : (
            blocks.map((block) => (
              <View key={block.blockedUserId} style={{ borderTopColor: colors.border, borderTopWidth: 1, gap: 8, paddingTop: 12 }}>
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: "900" }}>{block.user.name}</Text>
                <Text style={{ color: colors.muted, fontSize: 13 }}>
                  {block.user.publicProfileEnabled && block.user.username ? `@${block.user.username}` : "公開プロフィール非公開"}
                </Text>
                <Button
                  loading={unblockingId === block.blockedUserId}
                  loadingLabel="解除中..."
                  onPress={() => handleUnblock(block.blockedUserId)}
                  variant="secondary"
                >
                  ブロック解除
                </Button>
              </View>
            ))
          )}
        </Card>
      ) : null}
      {user ? (
        <Card>
          <SectionTitle
            title="危険な操作"
            subtitle="アカウントと関連データを削除します。この操作は原則として取り消せません。"
          />
          <Button variant="danger" onPress={() => router.push("/account/delete" as Href)}>
            アカウントを削除する
          </Button>
        </Card>
      ) : null}
      <Button variant="danger" onPress={handleLogout}>
        ログアウト
      </Button>
    </Screen>
  );
}
