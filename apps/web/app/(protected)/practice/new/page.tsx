import { Card, PageHeader } from "@/components/ui";
import { PracticeForm } from "@/components/practice-form";

export default function NewPracticePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="練習記録を作成" description="今日の練習内容を残します。" />
      <Card className="p-5 sm:p-7">
        <PracticeForm />
      </Card>
    </div>
  );
}
