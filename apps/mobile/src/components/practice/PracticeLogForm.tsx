import { useEffect, useMemo, useState } from "react";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { fetchPracticeMenus } from "@/api/practice-menus";
import type { PracticeInput } from "@/api/practice";
import { useFormScreen } from "@/components/FormScreen";
import { todayInputValue } from "@/components/format";
import { Button, Card, EmptyState, ErrorMessage, InlineField, LoadingState, SectionTitle, TextField, colors } from "@/components/ui";
import { getAccessToken } from "@/storage/token";
import type { PracticeLog, PracticeMenu } from "@/types";

type PracticeLogFormProps = {
  initialLog?: PracticeLog;
  submitLabel: string;
  savingLabel: string;
  onSubmit: (input: PracticeInput) => Promise<void>;
};

export function PracticeLogForm({ initialLog, onSubmit, savingLabel, submitLabel }: PracticeLogFormProps) {
  const { dismissKeyboard, scrollToEndOnFocus } = useFormScreen();
  const [practicedAt, setPracticedAt] = useState(toInputDate(initialLog?.practicedAt) ?? todayInputValue());
  const [durationMin, setDurationMin] = useState(initialLog ? String(initialLog.durationMin) : "");
  const [location, setLocation] = useState(initialLog?.location ?? "");
  const [content, setContent] = useState(initialLog?.content ?? "");
  const [memo, setMemo] = useState(initialLog?.memo ?? "");
  const [practiceMenuId, setPracticeMenuId] = useState<string | null>(initialLog?.practiceMenuId ?? null);
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
    if (saving) {
      return;
    }

    const validationError = validatePracticeInput(practicedAt, durationMin);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSaving(true);

    try {
      await onSubmit({
        practicedAt: practicedAt.trim(),
        durationMin: Number(durationMin),
        location: location.trim(),
        content: content.trim(),
        memo: memo.trim(),
        practiceMenuId: practiceMenuId ?? null
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "練習記録を保存できませんでした");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
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
          onFocus={scrollToEndOnFocus}
          placeholder="サーブ練習、3球目攻撃、フットワークなど"
          value={content}
        />
        <TextField
          label="メモ"
          multiline
          onChangeText={setMemo}
          onFocus={scrollToEndOnFocus}
          placeholder="今日はバックハンドの安定感が課題だった"
          value={memo}
        />
      </Card>

      <Button loading={saving} loadingLabel={savingLabel} onPress={handleSave}>
        {submitLabel}
      </Button>
    </>
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

function toInputDate(value?: string) {
  return value?.slice(0, 10);
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
