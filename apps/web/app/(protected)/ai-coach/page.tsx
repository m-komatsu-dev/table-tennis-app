import { prisma } from "@table-tennis/db";
import { AiCoachDashboard } from "@/components/ai-coach-dashboard";
import { PageHeader } from "@/components/ui";
import { getRequiredUserId } from "@/lib/server-auth";

export default async function AiCoachPage() {
  const userId = await getRequiredUserId();
  const [matchCount, practiceCount] = await Promise.all([
    prisma.matchRecord.count({ where: { userId } }),
    prisma.practiceLog.count({ where: { userId } })
  ]);

  return (
    <>
      <PageHeader
        description="練習・試合記録をもとに、課題分析と次回の練習メニューを提案します。"
        title="AIコーチ"
      />
      <AiCoachDashboard initialDataSparse={matchCount < 3 || practiceCount < 3} />
    </>
  );
}
