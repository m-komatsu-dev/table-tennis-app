import { useEffect, useState } from "react";
import { router } from "expo-router";
import { Pressable, Text } from "react-native";
import { fetchPracticeMenus } from "@/api/practice-menus";
import { createPracticeLog } from "@/api/practice";
import { todayInputValue } from "@/components/format";
import { Button, Card, ErrorMessage, Header, LoadingState, Screen, SectionTitle, TextField, colors } from "@/components/ui";
import type { PracticeMenu } from "@/types";

export default function NewPracticeScreen() {
  const [practicedAt, setPracticedAt] = useState(todayInputValue());
  const [durationMin, setDurationMin] = useState("60");
  const [location, setLocation] = useState("");
  const [content, setContent] = useState("");
  const [memo, setMemo] = useState("");
  const [practiceMenuId, setPracticeMenuId] = useState<string | null>(null);
  const [menus, setMenus] = useState<PracticeMenu[]>([]);
  const [loadingMenus, setLoadingMenus] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMenus() {
      try {
        const result = await fetchPracticeMenus();
        setMenus(result.practiceMenus);
      } catch {
        setMenus([]);
      } finally {
        setLoadingMenus(false);
      }
    }

    loadMenus();
  }, []);

  async function handleSave() {
    setError(null);
    setSaving(true);

    try {
      const body = [content, memo].filter((value) => value.trim().length > 0).join("\n\n");
      await createPracticeLog({
        practicedAt,
        durationMin: Number(durationMin),
        location,
        content: body,
        practiceMenuId
      });
      router.replace("/practice");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "練習記録を保存できませんでした");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <Header subtitle="練習日、時間、場所、内容を記録します。" title="練習を記録" />
      <ErrorMessage message={error} />
      <Card>
        <TextField label="練習日" onChangeText={setPracticedAt} placeholder="2026-06-27" value={practicedAt} />
        <TextField
          keyboardType="number-pad"
          label="練習時間（分）"
          onChangeText={setDurationMin}
          placeholder="60"
          value={durationMin}
        />
        <TextField label="場所" onChangeText={setLocation} placeholder="市民体育館" value={location} />
        <TextField label="内容" multiline onChangeText={setContent} placeholder="サーブ練習、フットワークなど" value={content} />
        <TextField label="メモ" multiline onChangeText={setMemo} placeholder="気づき、次回やること" value={memo} />
      </Card>

      <Card>
        <SectionTitle title="練習メニュー" subtitle="使用したメニューがあれば選択します。" />
        {loadingMenus ? <LoadingState /> : null}
        <Pressable
          onPress={() => setPracticeMenuId(null)}
          style={[menuOptionStyle, practiceMenuId === null && selectedMenuOptionStyle]}
        >
          <Text style={menuOptionTextStyle}>指定なし</Text>
        </Pressable>
        {menus.map((menu) => (
          <Pressable
            key={menu.id}
            onPress={() => setPracticeMenuId(menu.id)}
            style={[menuOptionStyle, practiceMenuId === menu.id && selectedMenuOptionStyle]}
          >
            <Text style={menuOptionTextStyle}>{menu.title}</Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>
              {menu.totalMinutes ? `${menu.totalMinutes}分` : "時間未設定"}
            </Text>
          </Pressable>
        ))}
      </Card>

      <Button loading={saving} onPress={handleSave}>
        保存する
      </Button>
    </Screen>
  );
}

const menuOptionStyle = {
  borderColor: colors.border,
  borderRadius: 8,
  borderWidth: 1,
  gap: 4,
  padding: 12
};

const selectedMenuOptionStyle = {
  backgroundColor: "#ecfdf5",
  borderColor: "#6ee7b7"
};

const menuOptionTextStyle = {
  color: colors.text,
  fontSize: 15,
  fontWeight: "800" as const
};
