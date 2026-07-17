import { useState } from "react";
import { router } from "expo-router";
import type { Href } from "expo-router";
import { Text, View } from "react-native";
import { createFeedback } from "@/api/feedback";
import { Button, Card, ErrorMessage, Header, Screen, Segment, TextField, colors } from "@/components/ui";
import type { FeedbackCategory } from "@/types";

const categoryOptions: { label: string; value: FeedbackCategory }[] = [
  { label: "不具合", value: "BUG" },
  { label: "使いにくい", value: "USABILITY" },
  { label: "機能要望", value: "FEATURE_REQUEST" },
  { label: "安全性", value: "SAFETY" },
  { label: "その他", value: "OTHER" }
];

export default function FeedbackScreen() {
  const [category, setCategory] = useState<FeedbackCategory>("BUG");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await createFeedback({
        category,
        subject,
        body,
        sourcePath: "mobile:/feedback"
      });
      setCategory("BUG");
      setSubject("");
      setBody("");
      setSuccess("フィードバックを送信しました。ご協力ありがとうございます。");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "フィードバックを送信できませんでした。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen keyboardAware>
      <Header
        backLabel="戻る"
        onBack={() => router.back()}
        subtitle="不具合、使いにくい点、機能のご要望などをお送りください。"
        title="フィードバック"
      />
      <ErrorMessage message={error} />
      {success ? (
        <View style={{ backgroundColor: "#ecfdf5", borderColor: "#a7f3d0", borderRadius: 8, borderWidth: 1, padding: 12 }}>
          <Text style={{ color: colors.primaryDark, fontSize: 13, fontWeight: "800", lineHeight: 19 }}>{success}</Text>
        </View>
      ) : null}
      <Card>
        <View style={{ gap: 7 }}>
          <Text style={{ color: colors.text, fontSize: 13, fontWeight: "700" }}>カテゴリ</Text>
          <Segment options={categoryOptions} value={category} onChange={setCategory} />
        </View>
        <TextField label="件名" maxLength={100} onChangeText={setSubject} placeholder="例：保存時にエラーが出る" value={subject} />
        <TextField
          label="内容"
          maxLength={3000}
          multiline
          onChangeText={setBody}
          placeholder="起きたこと、期待した動き、使いにくかった点などを教えてください。"
          value={body}
        />
        <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18 }}>
          氏名、住所、電話番号などの個人情報は入力しないでください。
        </Text>
        <Text style={{ color: "#92400e", fontSize: 12, lineHeight: 18 }}>
          他のユーザー、募集、参加希望、チャットメッセージを報告する場合は、各画面の通報機能をご利用ください。
        </Text>
        <Button disabled={submitting} loading={submitting} loadingLabel="送信中..." onPress={handleSubmit}>
          送信する
        </Button>
        <Button variant="secondary" onPress={() => router.push("/feedback/history" as Href)}>
          自分の送信履歴
        </Button>
      </Card>
    </Screen>
  );
}
