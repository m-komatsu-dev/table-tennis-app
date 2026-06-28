import { router } from "expo-router";
import type { Href } from "expo-router";
import { createPartnerPost } from "@/api/partner-posts";
import { FormScreen } from "@/components/FormScreen";
import { PartnerPostForm } from "@/components/partner-posts/PartnerPostForm";
import { Header } from "@/components/ui";

export default function NewPartnerPostScreen() {
  return (
    <FormScreen>
      <Header backLabel="募集一覧へ戻る" onBack={() => router.replace("/partner-posts" as Href)} title="募集を作成" />
      <PartnerPostForm
        onSubmit={async (input) => {
          const result = await createPartnerPost(input);
          router.replace(`/partner-posts/${result.partnerPost.id}` as Href);
        }}
        savingLabel="作成中..."
        submitLabel="募集を作成する"
      />
    </FormScreen>
  );
}
