import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { fetchMatchRecord, updateMatchRecord } from "@/api/match";
import { FormScreen } from "@/components/FormScreen";
import { MatchRecordForm } from "@/components/match/MatchRecordForm";
import { ErrorMessage, Header, LoadingState } from "@/components/ui";
import type { MatchRecord } from "@/types";

export default function MatchEditScreen() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const matchId = Array.isArray(id) ? id[0] : id;
  const [item, setItem] = useState<MatchRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!matchId) {
        setError("試合記録が見つかりません");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await fetchMatchRecord(matchId);
        setItem(result.matchRecord);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "試合記録を取得できませんでした");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [matchId]);

  return (
    <FormScreen>
      <Header backLabel="詳細へ戻る" onBack={() => router.back()} title="試合記録を編集" />
      <ErrorMessage message={error} />
      {loading ? <LoadingState /> : null}
      {!loading && item && matchId ? (
        <MatchRecordForm
          initialRecord={item}
          onSubmit={async (input) => {
            await updateMatchRecord(matchId, input);
            router.replace(`/match/${matchId}`);
          }}
          savingLabel="更新中..."
          submitLabel="更新する"
        />
      ) : null}
    </FormScreen>
  );
}
