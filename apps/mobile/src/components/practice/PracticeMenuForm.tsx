import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { PracticeMenuInput } from "@/api/practice-menus";
import { Button, Card, ErrorMessage, SectionTitle, TextField, colors } from "@/components/ui";
import type { PracticeMenu, PracticeMenuCategory } from "@/types";

type PracticeMenuFormProps = {
  initialMenu?: PracticeMenu;
  submitLabel: string;
  savingLabel: string;
  onSubmit: (input: PracticeMenuInput) => Promise<void>;
};

const categoryOptions: { label: string; value: PracticeMenuCategory }[] = [
  { label: "サーブ", value: "SERVE" },
  { label: "レシーブ", value: "RECEIVE" },
  { label: "フォア", value: "FOREHAND" },
  { label: "バック", value: "BACKHAND" },
  { label: "フットワーク", value: "FOOTWORK" },
  { label: "ドライブ", value: "DRIVE" },
  { label: "ブロック", value: "BLOCK" },
  { label: "ゲーム", value: "GAME" },
  { label: "フィジカル", value: "PHYSICAL" },
  { label: "メンタル", value: "MENTAL" },
  { label: "その他", value: "OTHER" }
];

export const practiceMenuCategoryLabels = Object.fromEntries(
  categoryOptions.map((option) => [option.value, option.label])
) as Record<PracticeMenuCategory, string>;

export function PracticeMenuForm({ initialMenu, onSubmit, savingLabel, submitLabel }: PracticeMenuFormProps) {
  const [title, setTitle] = useState(initialMenu?.title ?? "");
  const [category, setCategory] = useState<PracticeMenuCategory>(getInitialCategory(initialMenu));
  const [description, setDescription] = useState(getInitialDescription(initialMenu));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (saving) {
      return;
    }

    const validationError = validateInput(title);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSaving(true);

    try {
      const trimmedTitle = title.trim();
      const trimmedDescription = description.trim();

      await onSubmit({
        title: trimmedTitle,
        goal: null,
        description: trimmedDescription || null,
        totalMinutes: null,
        items: [
          {
            title: trimmedTitle,
            description: trimmedDescription || null,
            category,
            durationMin: null,
            order: 0
          }
        ]
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "練習メニューを保存できませんでした");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <ErrorMessage message={error} />

      <Card>
        <SectionTitle title="練習メニュー" />
        <TextField
          label="練習内容"
          onChangeText={setTitle}
          placeholder="例: YGショート、バックドライブ、3球目攻撃"
          value={title}
        />
        <View style={{ gap: 8 }}>
          <Text style={{ color: colors.text, fontSize: 13, fontWeight: "700" }}>カテゴリ</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {categoryOptions.map((option) => {
              const selected = category === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setCategory(option.value)}
                  style={{
                    backgroundColor: selected ? "#ecfdf5" : "#ffffff",
                    borderColor: selected ? "#34d399" : colors.border,
                    borderRadius: 999,
                    borderWidth: 1,
                    justifyContent: "center",
                    minHeight: 40,
                    paddingHorizontal: 12,
                    paddingVertical: 8
                  }}
                >
                  <Text style={{ color: selected ? colors.primaryDark : colors.muted, fontSize: 13, fontWeight: "800" }}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <TextField
          label="説明"
          multiline
          onChangeText={setDescription}
          placeholder="例: 意識するポイント、回転、コース、成功条件など"
          value={description}
        />
      </Card>

      <Button loading={saving} loadingLabel={savingLabel} onPress={handleSave}>
        {submitLabel}
      </Button>
    </>
  );
}

function validateInput(title: string) {
  if (!title.trim()) {
    return "練習内容を入力してください";
  }

  return null;
}

function getInitialCategory(menu?: PracticeMenu): PracticeMenuCategory {
  return menu?.items[0]?.category ?? "OTHER";
}

function getInitialDescription(menu?: PracticeMenu) {
  return menu?.description ?? menu?.goal ?? menu?.items[0]?.description ?? "";
}
