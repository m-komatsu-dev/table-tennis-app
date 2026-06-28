import { useState } from "react";
import { Text } from "react-native";
import type { PartnerPostInput } from "@/api/partner-posts";
import { partnerPostStatusLabels, partnerPostTypeLabels } from "@/components/format";
import { Button, Card, ErrorMessage, SectionTitle, Segment, TextField, colors } from "@/components/ui";
import type { PartnerPost, PartnerPostStatus, PartnerPostType } from "@/types";

type PartnerPostFormProps = {
  initialPost?: PartnerPost;
  includeStatus?: boolean;
  submitLabel: string;
  savingLabel: string;
  onSubmit: (input: PartnerPostInput) => Promise<void>;
};

const safetyMessage = "安全のため、住所・電話番号・メールアドレスなどの個人情報は書かないでください。";

export function PartnerPostForm({ includeStatus = false, initialPost, onSubmit, savingLabel, submitLabel }: PartnerPostFormProps) {
  const [type, setType] = useState<PartnerPostType>(initialPost?.type ?? "PRACTICE");
  const [title, setTitle] = useState(initialPost?.title ?? "");
  const [area, setArea] = useState(initialPost?.area ?? "");
  const [preferredTime, setPreferredTime] = useState(initialPost?.preferredTime ?? "");
  const [level, setLevel] = useState(initialPost?.level ?? "");
  const [purpose, setPurpose] = useState(initialPost?.purpose ?? "");
  const [message, setMessage] = useState(initialPost?.message ?? "");
  const [status, setStatus] = useState<PartnerPostStatus>(initialPost?.status ?? "OPEN");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (saving) {
      return;
    }

    const validationError = validatePartnerPostInput({ title, area, preferredTime, level, purpose, message });

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSaving(true);

    try {
      await onSubmit({
        type,
        title: title.trim(),
        area: area.trim(),
        preferredTime: preferredTime.trim(),
        level: level.trim(),
        purpose: purpose.trim(),
        message: message.trim(),
        status
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "募集を保存できませんでした");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <ErrorMessage message={error} />

      <Card>
        <SectionTitle title="募集内容" />
        <Segment
          onChange={setType}
          options={[
            { label: partnerPostTypeLabels.PRACTICE, value: "PRACTICE" },
            { label: partnerPostTypeLabels.MATCH, value: "MATCH" }
          ]}
          value={type}
        />
        <TextField label="タイトル" maxLength={60} onChangeText={setTitle} placeholder="例: ドライブ練習に付き合ってくれる人募集" value={title} />
        <TextField label="エリア" maxLength={100} onChangeText={setArea} placeholder="例: 東京都江戸川区" value={area} />
        <TextField label="希望日時" maxLength={100} onChangeText={setPreferredTime} placeholder="例: 土曜午後" value={preferredTime} />
        <TextField label="レベル" maxLength={50} onChangeText={setLevel} placeholder="例: 初級〜中級" value={level} />
        <TextField label="目的" maxLength={120} onChangeText={setPurpose} placeholder="例: サーブ・レシーブ練習" value={purpose} />
        <TextField
          label="募集メッセージ"
          maxLength={500}
          multiline
          onChangeText={setMessage}
          placeholder="例: 1〜2時間ほど軽く練習したいです。"
          value={message}
        />
      </Card>

      {includeStatus ? (
        <Card>
          <SectionTitle title="募集ステータス" />
          <Segment
            onChange={setStatus}
            options={[
              { label: partnerPostStatusLabels.OPEN, value: "OPEN" },
              { label: partnerPostStatusLabels.CLOSED, value: "CLOSED" }
            ]}
            value={status}
          />
        </Card>
      ) : null}

      <Card>
        <SectionTitle title="安全のために" />
        <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21 }}>{safetyMessage}</Text>
      </Card>

      <Button loading={saving} loadingLabel={savingLabel} onPress={handleSave}>
        {submitLabel}
      </Button>
    </>
  );
}

function validatePartnerPostInput(input: {
  title: string;
  area: string;
  preferredTime: string;
  level: string;
  purpose: string;
  message: string;
}) {
  if (!input.title.trim()) {
    return "タイトルを入力してください";
  }

  if (input.title.trim().length > 60) {
    return "タイトルは60文字以内で入力してください";
  }

  if (input.area.trim().length > 100) {
    return "エリアは100文字以内で入力してください";
  }

  if (input.preferredTime.trim().length > 100) {
    return "希望日時は100文字以内で入力してください";
  }

  if (input.level.trim().length > 50) {
    return "レベルは50文字以内で入力してください";
  }

  if (input.purpose.trim().length > 120) {
    return "目的は120文字以内で入力してください";
  }

  if (input.message.trim().length > 500) {
    return "募集メッセージは500文字以内で入力してください";
  }

  return null;
}
