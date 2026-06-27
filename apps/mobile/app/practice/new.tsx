import { router, useLocalSearchParams } from "expo-router";
import { createPracticeLog } from "@/api/practice";
import { FormScreen } from "@/components/FormScreen";
import { PracticeLogForm } from "@/components/practice/PracticeLogForm";
import { Header } from "@/components/ui";

export default function NewPracticeScreen() {
  const { practiceMenuId } = useLocalSearchParams<{ practiceMenuId?: string | string[] }>();
  const selectedPracticeMenuId = Array.isArray(practiceMenuId) ? practiceMenuId[0] : practiceMenuId;

  return (
    <FormScreen>
      <Header backLabel="戻る" onBack={() => router.back()} title="練習記録を追加" />
      <PracticeLogForm
        initialPracticeMenuId={selectedPracticeMenuId ?? null}
        onSubmit={async (input) => {
          await createPracticeLog(input);
          router.replace("/practice");
        }}
        savingLabel="保存中..."
        submitLabel="保存する"
      />
    </FormScreen>
  );
}
