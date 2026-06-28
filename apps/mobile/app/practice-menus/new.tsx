import { router } from "expo-router";
import { createPracticeMenu } from "@/api/practice-menus";
import { FormScreen } from "@/components/FormScreen";
import { PracticeMenuForm } from "@/components/practice/PracticeMenuForm";
import { Header } from "@/components/ui";

export default function NewPracticeMenuScreen() {
  return (
    <FormScreen>
      <Header backLabel="一覧へ戻る" onBack={() => router.back()} title="練習メニューを作成" />
      <PracticeMenuForm
        onSubmit={async (input) => {
          await createPracticeMenu(input);
          router.replace("/(tabs)/practice-menus");
        }}
        savingLabel="保存中..."
        submitLabel="保存する"
      />
    </FormScreen>
  );
}
