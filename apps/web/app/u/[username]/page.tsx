import { notFound } from "next/navigation";
import { prisma } from "@table-tennis/db";
import { Badge, Card } from "@/components/ui";
import { formatDate, percentage } from "@/lib/format";
import { formatSetCount, matchResultLabels, matchTypeLabels } from "@/lib/match-record";
import { profileLevelNames } from "@/lib/profile";
import type { ScoreRow } from "@/types/app";

type PageProps = {
  params: Promise<{ username: string }>;
};

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params;
  const user = await prisma.user.findFirst({
    where: {
      username: username.toLowerCase(),
      publicProfileEnabled: true
    },
    select: {
      name: true,
      username: true,
      level: true,
      playStyle: true,
      practiceLogs: {
        where: { isPublic: true },
        include: { practiceMenu: { select: { title: true } } },
        orderBy: { practicedAt: "desc" },
        take: 50
      },
      matchRecords: {
        where: { isPublic: true },
        orderBy: { playedAt: "desc" },
        take: 50
      }
    }
  });

  if (!user || !user.username) {
    notFound();
  }

  const totalPracticeMinutes = user.practiceLogs.reduce((total, log) => total + log.durationMin, 0);
  const wins = user.matchRecords.filter((match) => match.result === "WIN").length;
  const losses = user.matchRecords.filter((match) => match.result === "LOSE").length;
  const decidedMatches = wins + losses;
  const winRate = decidedMatches > 0 ? (wins / decidedMatches) * 100 : 0;
  const practiceMenus = getTopPracticeMenus(user.practiceLogs);
  const recentPractices = user.practiceLogs.slice(0, 5);
  const recentMatches = user.matchRecords.slice(0, 5);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <section className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-bold text-emerald-700">@{user.username}</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{user.name}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                {user.playStyle ?? "卓球の練習・試合記録を公開しています。"}
              </p>
            </div>
            <Badge tone="emerald">{profileLevelNames[user.level]}</Badge>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="総練習時間" value={formatDuration(totalPracticeMinutes)} />
          <StatCard label="総試合数" value={`${user.matchRecords.length}試合`} />
          <StatCard label="勝率" value={percentage(winRate)} />
          <StatCard label="主な練習" value={practiceMenus[0]?.name ?? "記録中"} />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Card>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-950">主な練習カテゴリ</h2>
              <p className="mt-1 text-sm text-slate-500">公開されている練習記録から集計しています。</p>
            </div>
            {practiceMenus.length > 0 ? (
              <div className="space-y-3">
                {practiceMenus.map((menu) => (
                  <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3" key={menu.name}>
                    <span className="min-w-0 truncate text-sm font-bold text-slate-800">{menu.name}</span>
                    <span className="shrink-0 text-sm font-semibold text-emerald-700">{formatDuration(menu.minutes)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">公開練習記録はまだありません。</p>
            )}
          </Card>

          <Card>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-950">最近の公開試合記録</h2>
              <p className="mt-1 text-sm text-slate-500">対戦相手名は表示しません。</p>
            </div>
            {recentMatches.length > 0 ? (
              <div className="space-y-3">
                {recentMatches.map((match) => (
                  <article className="rounded-xl border border-slate-100 bg-white px-4 py-3" key={match.id}>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={match.result === "WIN" ? "emerald" : match.result === "LOSE" ? "red" : "slate"}>
                        {matchResultLabels[match.result]}
                      </Badge>
                      <Badge tone="blue">{matchTypeLabels[match.matchType]}</Badge>
                    </div>
                    <p className="mt-2 text-sm font-bold text-slate-900">{formatDate(match.playedAt)} / {formatSetCount(toScores(match.scores))}</p>
                    {match.memo ? <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{match.memo}</p> : null}
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">公開試合記録はまだありません。</p>
            )}
          </Card>
        </section>

        <section className="mt-6">
          <Card>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-950">最近の公開練習記録</h2>
              <p className="mt-1 text-sm text-slate-500">ユーザーが公開にした練習記録だけを表示しています。</p>
            </div>
            {recentPractices.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {recentPractices.map((practice) => (
                  <article className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3" key={practice.id}>
                    <p className="text-sm font-bold text-slate-900">{formatDate(practice.practicedAt)}</p>
                    <p className="mt-1 text-base font-black text-emerald-700">{practice.durationMin}分</p>
                    <p className="mt-2 text-sm font-semibold text-slate-700">{practice.practiceMenu?.title ?? "練習メニュー未設定"}</p>
                    {practice.content ? <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{practice.content}</p> : null}
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">公開練習記録はまだありません。</p>
            )}
          </Card>
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-2 truncate text-2xl font-black text-slate-950">{value}</p>
    </Card>
  );
}

function getTopPracticeMenus(practiceLogs: Array<{ durationMin: number; practiceMenu: { title: string } | null }>) {
  const totals = new Map<string, number>();

  for (const log of practiceLogs) {
    const name = log.practiceMenu?.title ?? "指定なし";
    totals.set(name, (totals.get(name) ?? 0) + log.durationMin);
  }

  return Array.from(totals.entries())
    .map(([name, minutes]) => ({ name, minutes }))
    .sort((a, b) => b.minutes - a.minutes || a.name.localeCompare(b.name, "ja"))
    .slice(0, 5);
}

function toScores(value: unknown): ScoreRow[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isScoreRow);
}

function isScoreRow(value: unknown): value is ScoreRow {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as ScoreRow).set === "number" &&
    typeof (value as ScoreRow).me === "number" &&
    typeof (value as ScoreRow).opp === "number"
  );
}

function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) {
    return `${totalMinutes}分`;
  }

  return minutes > 0 ? `${hours}時間${minutes}分` : `${hours}時間`;
}
