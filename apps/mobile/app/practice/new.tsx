import { router } from "expo-router";
import { createPracticeLog } from "@/api/practice";
import { PracticeLogForm } from "@/components/practice/PracticeLogForm";
import { Header, Screen } from "@/components/ui";

export default function NewPracticeScreen() {
  return (
    <Screen keyboardAware>
      <Header backLabel="戻る" onBack={() => router.back()} title="練習記録を追加" />
      <PracticeLogForm
        onSubmit={async (input) => {
          await createPracticeLog(input);
          router.replace("/practice");
        }}
        savingLabel="保存中..."
        submitLabel="保存する"
      />
    </Screen>
  );
}
