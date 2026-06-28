import { useCallback, useState } from "react";
import { Alert, Switch, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { fetchProfile, updateProfile } from "@/api/profile";
import { genderLabels, levelLabels } from "@/components/format";
import { Button, Card, ErrorMessage, Header, LoadingState, Screen, SectionTitle, Segment, TextField } from "@/components/ui";
import type { Gender, Level } from "@/types";

const levelOptions: { label: string; value: Level }[] = [
  { value: "BEGINNER", label: levelLabels.BEGINNER },
  { value: "INTERMEDIATE", label: levelLabels.INTERMEDIATE },
  { value: "ADVANCED", label: levelLabels.ADVANCED },
  { value: "COMPETITIVE", label: levelLabels.COMPETITIVE },
  { value: "PRO", label: levelLabels.PRO }
];

const genderOptions: { label: string; value: Gender }[] = [
  { value: "MALE", label: genderLabels.MALE },
  { value: "FEMALE", label: genderLabels.FEMALE },
  { value: "OTHER", label: genderLabels.OTHER },
  { value: "NO_ANSWER", label: "未設定" }
];

export default function ProfileEditScreen() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [level, setLevel] = useState<Level>("BEGINNER");
  const [gender, setGender] = useState<Gender>("NO_ANSWER");
  const [publicProfileEnabled, setPublicProfileEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const result = await fetchProfile();
      setName(result.user.name);
      setUsername(result.user.username ?? "");
      setLevel(result.user.level ?? "BEGINNER");
      setGender(result.user.gender ?? "NO_ANSWER");
      setPublicProfileEnabled(result.user.publicProfileEnabled);
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

  async function handleSave() {
    if (saving) {
      return;
    }

    const trimmedName = name.trim();

    if (trimmedName.length === 0) {
      setError("入力内容を確認してください");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await updateProfile({
        name: trimmedName,
        username: username.trim(),
        level,
        gender,
        publicProfileEnabled
      });
      Alert.alert("プロフィールを更新しました");
      router.back();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "通信に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen keyboardAware>
      <Header onBack={() => router.back()} title="プロフィール編集" />
      <ErrorMessage message={error} />
      {loading ? <LoadingState /> : null}
      {!loading ? (
        <>
          <Card>
            <TextField
              autoCapitalize="none"
              label="名前"
              maxLength={50}
              onChangeText={setName}
              placeholder="名前を入力"
              value={name}
            />
            <TextField
              autoCapitalize="none"
              autoCorrect={false}
              label="公開ユーザー名"
              maxLength={30}
              onChangeText={setUsername}
              placeholder="例: tabletennis_2026"
              value={username}
            />
            <SectionTitle title="レベル" />
            <Segment onChange={setLevel} options={levelOptions} value={level} />
            <SectionTitle title="性別" />
            <Segment onChange={setGender} options={genderOptions} value={gender} />
          </Card>
          <Card>
            <SectionTitle title="公開プロフィール" subtitle="設定をONにした場合のみ外部に表示されます。" />
            <View style={{ alignItems: "center", flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ color: "#0f172a", fontSize: 15, fontWeight: "800" }}>公開プロフィールを有効にする</Text>
                <Text style={{ color: "#64748b", fontSize: 13, lineHeight: 19 }}>公開ユーザー名が空の場合は表示されません。</Text>
              </View>
              <Switch
                onValueChange={setPublicProfileEnabled}
                thumbColor="#ffffff"
                trackColor={{ false: "#cbd5e1", true: "#34d399" }}
                value={publicProfileEnabled}
              />
            </View>
          </Card>
          <Button loading={saving} loadingLabel="保存中..." onPress={handleSave}>
            保存
          </Button>
        </>
      ) : null}
    </Screen>
  );
}
