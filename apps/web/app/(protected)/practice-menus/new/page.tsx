import { PracticeMenuForm } from "@/components/practice-menu-form";
import { Card, PageHeader } from "@/components/ui";

export default function NewPracticeMenuPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader description="目的と練習項目を組み合わせて、再利用できるテンプレートを作ります。" title="練習メニューを作成" />
      <Card className="p-5 sm:p-7"><PracticeMenuForm /></Card>
    </div>
  );
}
