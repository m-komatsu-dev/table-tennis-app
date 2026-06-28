import { Card, PageHeader } from "@/components/ui";
import { PartnerPostForm } from "@/components/partner-posts/partner-post-form";

type PageProps = {
  searchParams: Promise<{ error?: string | string[] }>;
};

export default async function NewPartnerPostPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        description="練習相手・試合相手の募集を作成します。連絡先や具体的すぎる住所は書かないでください。"
        title="募集を作成"
      />
      <Card className="p-5 sm:p-7">
        <PartnerPostForm error={singleParam(params.error)} />
      </Card>
    </div>
  );
}

function singleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
