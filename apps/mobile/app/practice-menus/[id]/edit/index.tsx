import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import type { Href } from "expo-router";
import { fetchPracticeMenu, updatePracticeMenu } from "@/api/practice-menus";
import { FormScreen } from "@/components/FormScreen";
import { PracticeMenuForm } from "@/components/practice/PracticeMenuForm";
import { ErrorMessage, Header, LoadingState } from "@/components/ui";
import type { PracticeMenu } from "@/types";

export default function PracticeMenuEditScreen() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const menuId = Array.isArray(id) ? id[0] : id;
  const [item, setItem] = useState<PracticeMenu | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!menuId) {
        setError("練習メニューが見つかりません");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await fetchPracticeMenu(menuId);
        setItem(result.practiceMenu);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "練習メニューを取得できませんでした");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [menuId]);

  return (
    <FormScreen>
      <Header backLabel="詳細へ戻る" onBack={() => router.back()} title="練習メニューを編集" />
      <ErrorMessage message={error} />
      {loading ? <LoadingState /> : null}
      {!loading && item && menuId ? (
        <PracticeMenuForm
          initialMenu={item}
          onSubmit={async (input) => {
            await updatePracticeMenu(menuId, input);
            router.replace(`/practice-menus/${menuId}` as Href);
          }}
          savingLabel="更新中..."
          submitLabel="更新する"
        />
      ) : null}
    </FormScreen>
  );
}
