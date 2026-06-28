import { useCallback, useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import type { Href } from "expo-router";
import { fetchPartnerPost, updatePartnerPost } from "@/api/partner-posts";
import { FormScreen } from "@/components/FormScreen";
import { PartnerPostForm } from "@/components/partner-posts/PartnerPostForm";
import { ErrorMessage, Header, LoadingState } from "@/components/ui";
import type { PartnerPost } from "@/types";

export default function PartnerPostEditScreen() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const postId = Array.isArray(id) ? id[0] : id;
  const [item, setItem] = useState<PartnerPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!postId) {
      setError("募集が見つかりません");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchPartnerPost(postId);
      setItem(result.partnerPost);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "募集を取得できませんでした");
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <FormScreen>
      <Header backLabel="詳細へ戻る" onBack={() => router.back()} title="募集を編集" />
      <ErrorMessage actionLabel="再読み込み" message={error} onAction={load} />
      {loading ? <LoadingState /> : null}
      {!loading && item && postId ? (
        <PartnerPostForm
          includeStatus
          initialPost={item}
          onSubmit={async (input) => {
            await updatePartnerPost(postId, input);
            router.replace(`/partner-posts/${postId}` as Href);
          }}
          savingLabel="更新中..."
          submitLabel="更新する"
        />
      ) : null}
    </FormScreen>
  );
}
