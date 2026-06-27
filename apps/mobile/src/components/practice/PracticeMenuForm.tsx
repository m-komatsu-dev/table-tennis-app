import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { PracticeMenuInput } from "@/api/practice-menus";
import { Button, Card, ErrorMessage, InlineField, SectionTitle, TextField, colors } from "@/components/ui";
import type { PracticeMenu, PracticeMenuCategory } from "@/types";

type EditableItem = {
  key: string;
  title: string;
  description: string;
  category: PracticeMenuCategory;
  durationMin: string;
};

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
  const [goal, setGoal] = useState(initialMenu?.goal ?? "");
  const [description, setDescription] = useState(initialMenu?.description ?? "");
  const [totalMinutes, setTotalMinutes] = useState(initialMenu?.totalMinutes ? String(initialMenu.totalMinutes) : "");
  const [items, setItems] = useState<EditableItem[]>(() =>
    initialMenu?.items.length
      ? initialMenu.items.map((item) => ({
          key: item.id,
          title: item.title,
          description: item.description ?? "",
          category: item.category,
          durationMin: item.durationMin ? String(item.durationMin) : ""
        }))
      : [newItem()]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const computedTotalMinutes = useMemo(() => {
    const sum = items.reduce((total, item) => total + (numericValue(item.durationMin) ?? 0), 0);
    return sum > 0 ? sum : null;
  }, [items]);

  function updateItem(key: string, patch: Partial<EditableItem>) {
    setItems((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }

  function addItem() {
    setItems((current) => [...current, newItem()]);
  }

  function removeItem(key: string) {
    setItems((current) => (current.length > 1 ? current.filter((item) => item.key !== key) : current));
  }

  async function handleSave() {
    if (saving) {
      return;
    }

    const validationError = validateInput(title, totalMinutes, items);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSaving(true);

    try {
      await onSubmit({
        title: title.trim(),
        goal: goal.trim() || null,
        description: description.trim() || null,
        totalMinutes: numericValue(totalMinutes) ?? computedTotalMinutes,
        items: items.map((item, index) => ({
          title: item.title.trim(),
          description: item.description.trim() || null,
          category: item.category,
          durationMin: numericValue(item.durationMin),
          order: index
        }))
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
        <SectionTitle title="基本情報" />
        <TextField label="メニュー名" onChangeText={setTitle} placeholder="サーブ強化メニュー" value={title} />
        <TextField
          label="目的"
          multiline
          onChangeText={setGoal}
          placeholder="3球目につながる短い下回転サーブを安定させる"
          value={goal}
        />
        <TextField
          label="説明"
          multiline
          onChangeText={setDescription}
          placeholder="練習全体の流れや意識するポイント"
          value={description}
        />
        <InlineField
          keyboardType="number-pad"
          label="合計時間"
          onChangeText={setTotalMinutes}
          placeholder={computedTotalMinutes ? String(computedTotalMinutes) : "60"}
          suffix="分"
          value={totalMinutes}
        />
      </Card>

      <Card>
        <SectionTitle title="メニュー項目" subtitle="1件以上入力してください。" />
        <View style={{ gap: 14 }}>
          {items.map((item, index) => (
            <View
              key={item.key}
              style={{
                borderColor: colors.border,
                borderRadius: 8,
                borderWidth: 1,
                gap: 10,
                padding: 12
              }}
            >
              <View style={{ alignItems: "center", flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: "900" }}>項目 {index + 1}</Text>
                <Pressable disabled={items.length === 1} onPress={() => removeItem(item.key)} style={{ opacity: items.length === 1 ? 0.35 : 1 }}>
                  <Text style={{ color: colors.danger, fontSize: 13, fontWeight: "900" }}>削除</Text>
                </Pressable>
              </View>
              <TextField label="項目名" onChangeText={(value) => updateItem(item.key, { title: value })} placeholder="ショートサーブ50本" value={item.title} />
              <InlineField
                keyboardType="number-pad"
                label="時間"
                onChangeText={(value) => updateItem(item.key, { durationMin: value })}
                placeholder="10"
                suffix="分"
                value={item.durationMin}
              />
              <View style={{ gap: 8 }}>
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: "700" }}>カテゴリ</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {categoryOptions.map((option) => {
                    const selected = item.category === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => updateItem(item.key, { category: option.value })}
                        style={{
                          backgroundColor: selected ? "#ecfdf5" : "#ffffff",
                          borderColor: selected ? "#34d399" : colors.border,
                          borderRadius: 999,
                          borderWidth: 1,
                          paddingHorizontal: 10,
                          paddingVertical: 7
                        }}
                      >
                        <Text style={{ color: selected ? colors.primaryDark : colors.muted, fontSize: 12, fontWeight: "800" }}>
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
                onChangeText={(value) => updateItem(item.key, { description: value })}
                placeholder="コース、回転、成功条件など"
                value={item.description}
              />
            </View>
          ))}
        </View>
        <Button onPress={addItem} variant="secondary">
          項目を追加
        </Button>
      </Card>

      <Button loading={saving} loadingLabel={savingLabel} onPress={handleSave}>
        {submitLabel}
      </Button>
    </>
  );
}

function newItem(): EditableItem {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title: "",
    description: "",
    category: "OTHER",
    durationMin: ""
  };
}

function numericValue(value: string) {
  if (!value.trim()) {
    return null;
  }

  return Number(value);
}

function validateInput(title: string, totalMinutes: string, items: EditableItem[]) {
  if (!title.trim()) {
    return "メニュー名を入力してください";
  }

  if (totalMinutes.trim() && (!/^\d+$/.test(totalMinutes.trim()) || Number(totalMinutes) <= 0)) {
    return "合計時間は1分以上の数値で入力してください";
  }

  if (items.some((item) => !item.title.trim())) {
    return "すべての項目名を入力してください";
  }

  if (items.some((item) => item.durationMin.trim() && (!/^\d+$/.test(item.durationMin.trim()) || Number(item.durationMin) <= 0))) {
    return "項目の時間は1分以上の数値で入力してください";
  }

  return null;
}
