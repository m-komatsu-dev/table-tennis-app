import { useEffect, useMemo, useState } from "react";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { fetchPracticeMenus } from "@/api/practice-menus";
import { createPracticeLog } from "@/api/practice";
import { todayInputValue } from "@/components/format";
import {
  Card,
  EmptyState,
  ErrorMessage,
  Header,
  InlineField,
  LoadingState,
  Button,
  Screen,
  SectionTitle,
  TextField,
  colors
} from "@/components/ui";
import { getAccessToken } from "@/storage/token";
import type { PracticeMenu } from "@/types";

export default function NewPracticeScreen() {
  const [practicedAt, setPracticedAt] = useState(todayInputValue());
  const [durationMin, setDurationMin] = useState("");
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
      const token = await getAccessToken();

      if (!token) {
        router.replace("/login");
        return;
      }

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

  const selectedMenu = useMemo(
    () => menus.find((menu) => menu.id === practiceMenuId) ?? null,
    [menus, practiceMenuId]
  );

  async function handleSave() {
    const validationError = validatePracticeInput(practicedAt, durationMin);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSaving(true);

    try {
      const body = [
        content.trim(),
        memo.trim().length > 0 ? `メモ\n${memo.trim()}` : ""
      ]
        .filter((value) => value.length > 0)
        .join("\n\n");

      await createPracticeLog({
        practicedAt: practicedAt.trim(),
        durationMin: Number(durationMin),
        location: location.trim(),
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
      <Header backLabel="戻る" onBack={() => router.back()} title="練習記録を追加" />
      <ErrorMessage message={error} />

      <Card>
        <SectionTitle title="基本情報" />
        <TextField label="練習日" onChangeText={setPracticedAt} placeholder="2026-06-27" value={practicedAt} />
        <InlineField
          keyboardType="number-pad"
          label="練習時間"
          onChangeText={setDurationMin}
          placeholder="90"
          suffix="分"
          value={durationMin}
        />
        <TextField label="場所" onChangeText={setLocation} placeholder="市民体育館" value={location} />
      </Card>

      <Card>
        <SectionTitle title="練習メニュー" subtitle="未選択でも保存できます。" />
        {loadingMenus ? <LoadingState /> : null}
        {!loadingMenus ? (
          <View style={{ gap: 10 }}>
            <PracticeMenuOption
              active={practiceMenuId === null}
              description="メニューを使わずに記録します"
              onPress={() => setPracticeMenuId(null)}
              timeLabel="任意"
              title="指定なし"
            />
            {menus.length === 0 ? <EmptyState>練習メニューはまだありません</EmptyState> : null}
            {menus.map((menu) => (
              <PracticeMenuOption
                key={menu.id}
                active={selectedMenu?.id === menu.id}
                description={menu.goal ?? menu.description ?? "目的は未設定です"}
                onPress={() => setPracticeMenuId(menu.id)}
                timeLabel={menu.totalMinutes ? `${menu.totalMinutes}分` : "時間未設定"}
                title={menu.title}
              />
            ))}
          </View>
        ) : null}
      </Card>

      <Card>
        <SectionTitle title="内容・メモ" />
        <TextField
          label="練習内容"
          multiline
          onChangeText={setContent}
          placeholder="サーブ練習、3球目攻撃、フットワークなど"
          value={content}
        />
        <TextField
          label="メモ"
          multiline
          onChangeText={setMemo}
          placeholder="今日はバックハンドの安定感が課題だった"
          value={memo}
        />
      </Card>

      <Button loading={saving} loadingLabel="保存中..." onPress={handleSave}>
        保存する
      </Button>
    </Screen>
  );
}

function PracticeMenuOption({
  active,
  description,
  onPress,
  timeLabel,
  title
}: {
  active: boolean;
  description: string;
  onPress: () => void;
  timeLabel: string;
  title: string;
}) {
  return (
    <Pressable onPress={onPress} style={[menuOptionStyle, active && selectedMenuOptionStyle]}>
      <View style={{ flexDirection: "row", gap: 10, justifyContent: "space-between" }}>
        <Text style={[menuOptionTitleStyle, active && selectedMenuOptionTextStyle]}>{title}</Text>
        <Text style={[menuOptionMetaStyle, active && selectedMenuOptionTextStyle]}>{timeLabel}</Text>
      </View>
      <Text style={[menuOptionDescriptionStyle, active && selectedMenuOptionTextStyle]}>{description}</Text>
    </Pressable>
  );
}

function validatePracticeInput(practicedAt: string, durationMin: string) {
  if (!practicedAt.trim()) {
    return "練習日を入力してください";
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(practicedAt.trim()) || Number.isNaN(Date.parse(practicedAt))) {
    return "練習日はYYYY-MM-DD形式で入力してください";
  }

  if (!durationMin.trim()) {
    return "練習時間を入力してください";
  }

  if (!/^\d+$/.test(durationMin.trim()) || Number(durationMin) <= 0) {
    return "練習時間は1分以上の数値で入力してください";
  }

  return null;
}

const menuOptionStyle = {
  borderColor: colors.border,
  borderRadius: 8,
  borderWidth: 1,
  gap: 6,
  padding: 12
};

const selectedMenuOptionStyle = {
  backgroundColor: "#ecfdf5",
  borderColor: "#34d399"
};

const menuOptionTitleStyle = {
  color: colors.text,
  flex: 1,
  fontSize: 15,
  fontWeight: "800" as const
};

const menuOptionMetaStyle = {
  color: colors.primaryDark,
  fontSize: 13,
  fontWeight: "800" as const
};

const menuOptionDescriptionStyle = {
  color: colors.muted,
  fontSize: 13,
  lineHeight: 19
};

const selectedMenuOptionTextStyle = {
  color: colors.primaryDark
};
