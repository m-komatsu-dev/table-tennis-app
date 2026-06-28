import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import type { Href } from "expo-router";
import { fetchProfile } from "@/api/profile";
import { genderLabels, levelLabels } from "@/components/format";
import { Button, Card, ErrorMessage, Header, LoadingState, Row, Screen } from "@/components/ui";
import { clearAccessToken } from "@/storage/token";
import type { User } from "@/types";

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchProfile();
      setUser(result.user);
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
      <Button variant="danger" onPress={handleLogout}>
        ログアウト
      </Button>
    </Screen>
  );
}
