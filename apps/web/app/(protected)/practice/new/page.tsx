import { Card, PageHeader } from "@/components/ui";
import { PracticeForm } from "@/components/practice-form";

export default function NewPracticePage() {
  return (
    <>
      <PageHeader title="練習記録を作成" description="今日の練習内容を残します。" />
      <Card>
        <PracticeForm />
      </Card>
    </>
  );
}
