import { Card, PageHeader } from "@/components/ui";
import { MatchForm } from "@/components/match-form";

export default function NewMatchPage() {
  return (
    <>
      <PageHeader title="試合記録を作成" description="対戦結果とセットスコアを残します。" />
      <Card>
        <MatchForm />
      </Card>
    </>
  );
}
