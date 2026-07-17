import { FeedbackForm } from "@/components/feedback-form";
import { PageHeader } from "@/components/ui";

export default function FeedbackPage() {
  return (
    <>
      <PageHeader
        description="不具合、使いにくい点、機能のご要望などをお送りください。緊急の安全上の問題や犯罪に関する相談は、本サービスではなく警察などの適切な機関へご相談ください。"
        title="フィードバック"
      />
      <FeedbackForm />
    </>
  );
}
