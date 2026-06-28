import { router } from "expo-router";
import { createMatchRecord } from "@/api/match";
import { FormScreen } from "@/components/FormScreen";
import { MatchRecordForm } from "@/components/match/MatchRecordForm";
import { Header } from "@/components/ui";

export default function NewMatchScreen() {
  return (
    <FormScreen>
      <Header backLabel="戻る" onBack={() => router.back()} title="試合記録を追加" />
      <MatchRecordForm
        onSubmit={async (input) => {
          await createMatchRecord(input);
          router.replace("/(tabs)/match");
        }}
        savingLabel="保存中..."
        submitLabel="保存する"
      />
    </FormScreen>
  );
}
