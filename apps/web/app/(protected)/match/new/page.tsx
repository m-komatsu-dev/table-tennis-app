import { Card, PageHeader } from "@/components/ui";
import { MatchForm } from "@/components/match-form";

export default function NewMatchPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="試合記録を作成" description="対戦結果とセットスコアを残します。" />
      <Card className="p-5 sm:p-7">
        <MatchForm />
      </Card>
    </div>
  );
}
