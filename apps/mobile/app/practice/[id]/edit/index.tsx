import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { fetchPracticeLog, updatePracticeLog } from "@/api/practice";
import { PracticeLogForm } from "@/components/practice/PracticeLogForm";
import { ErrorMessage, Header, LoadingState, Screen } from "@/components/ui";
import type { PracticeLog } from "@/types";

export default function PracticeEditScreen() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const practiceId = Array.isArray(id) ? id[0] : id;
  const [item, setItem] = useState<PracticeLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!practiceId) {
        setError("練習記録が見つかりません");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await fetchPracticeLog(practiceId);
        setItem(result.practiceLog);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "練習記録を取得できませんでした");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [practiceId]);

  return (
    <Screen keyboardAware>
      <Header backLabel="詳細へ戻る" onBack={() => router.back()} title="練習記録を編集" />
      <ErrorMessage message={error} />
      {loading ? <LoadingState /> : null}
      {!loading && item && practiceId ? (
        <PracticeLogForm
          initialLog={item}
          onSubmit={async (input) => {
            await updatePracticeLog(practiceId, input);
            router.replace(`/practice/${practiceId}`);
          }}
          savingLabel="更新中..."
          submitLabel="更新する"
        />
      ) : null}
    </Screen>
  );
}
