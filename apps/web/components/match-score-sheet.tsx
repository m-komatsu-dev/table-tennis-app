import { formatDate } from "@/lib/format";
import { calculateSetCount, matchResultLabels, matchTypeLabels } from "@/lib/match-record";
import { profileLevelNames } from "@/lib/profile";
import type { MatchRecordView, ProfileView, ScoreRow } from "@/types/app";

type MatchScoreSheetProps = {
  playerName: string;
  playerClub: string | null;
  playerLevel: ProfileView["level"];
  opponentName: string;
  opponentTeam: string | null;
  playedAt: string;
  matchType: MatchRecordView["matchType"];
  result: MatchRecordView["result"];
  scores: ScoreRow[];
  memo: string | null;
  equipmentName: string | null;
  compact?: boolean;
};

function GameCount({ value, label }: { value: number; label: string }) {
  return (
    <div className="mt-auto flex items-center justify-between gap-3 border-t border-dashed border-slate-400 pt-4">
      <span className="text-xs font-semibold tracking-wide text-slate-600">{label}</span>
      <strong className="grid size-14 place-items-center border-2 border-slate-900 bg-white text-3xl font-black tabular-nums text-slate-950">
        {value}
      </strong>
    </div>
  );
}

function ScoreRows({ scores, compact }: { scores: ScoreRow[]; compact: boolean }) {
  if (scores.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-500">スコア未登録</p>;
  }

  return (
    <ol className={compact ? "space-y-1.5" : "space-y-2.5"}>
      {scores.map((score, index) => (
        <li
          className="grid grid-cols-[1.5rem_1fr_1rem_1fr] items-center gap-1 border-b border-slate-300 pb-1 text-center tabular-nums last:border-b-0"
          key={`${score.set}-${index}`}
        >
          <span className="text-[10px] font-semibold text-slate-500">{score.set}</span>
          <strong className={`${score.me > score.opp ? "text-slate-950" : "font-medium text-slate-500"} ${compact ? "text-lg" : "text-2xl"}`}>
            {score.me}
          </strong>
          <span className="font-bold text-slate-400">-</span>
          <strong className={`${score.opp > score.me ? "text-slate-950" : "font-medium text-slate-500"} ${compact ? "text-lg" : "text-2xl"}`}>
            {score.opp}
          </strong>
        </li>
      ))}
    </ol>
  );
}

export function MatchScoreSheet({
  playerName,
  playerClub,
  playerLevel,
  opponentName,
  opponentTeam,
  playedAt,
  matchType,
  result,
  scores,
  memo,
  equipmentName,
  compact = false
}: MatchScoreSheetProps) {
  const setCount = calculateSetCount(scores);
  const resultStyle =
    result === "WIN"
      ? "border-emerald-700 bg-emerald-700 text-white"
      : result === "LOSE"
        ? "border-red-700 bg-red-700 text-white"
        : "border-slate-600 bg-slate-600 text-white";
  const sectionPadding = compact ? "p-4" : "p-5 sm:p-7";
  const nameStyle = compact ? "text-xl sm:text-2xl" : "text-2xl sm:text-4xl";

  return (
    <article className="overflow-hidden rounded-sm border-2 border-slate-900 bg-[#fffdf7] text-slate-950 shadow-sm transition group-hover:-translate-y-0.5 group-hover:shadow-md">
      <header className={`flex flex-wrap items-center justify-between gap-2 border-b-2 border-slate-900 ${compact ? "px-4 py-2.5" : "px-5 py-3"}`}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold">
          <time dateTime={playedAt}>{formatDate(playedAt)}</time>
          <span className="text-slate-500">{matchTypeLabels[matchType]}</span>
        </div>
        <span className={`inline-flex rounded-sm border px-3 py-1 text-xs font-bold tracking-wider ${resultStyle}`}>
          {matchResultLabels[result]}
        </span>
      </header>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(180px,0.7fr)_minmax(0,1fr)]">
        <section className={`order-1 flex min-h-52 flex-col border-b-2 border-slate-900 lg:min-h-0 lg:border-b-0 lg:border-r-2 ${sectionPadding}`}>
          <p className="text-xs font-bold tracking-[0.2em] text-slate-500">自分</p>
          <h2 className={`mt-4 wrap-break-words font-black tracking-wide ${nameStyle}`}>{playerName}</h2>
          <dl className="mt-5 space-y-2 border-t border-dashed border-slate-400 pt-3 text-sm">
            <div className="grid grid-cols-[4rem_1fr] gap-2">
              <dt className="font-semibold text-slate-500">所属</dt>
              <dd className="wrap-break-words font-medium">{playerClub || "未設定"}</dd>
            </div>
            <div className="grid grid-cols-[4rem_1fr] gap-2">
              <dt className="font-semibold text-slate-500">レベル</dt>
              <dd className="font-medium">{profileLevelNames[playerLevel]}</dd>
            </div>
            <div className="grid grid-cols-[4rem_1fr] gap-2">
              <dt className="font-semibold text-slate-500">使用用具</dt>
              <dd className="wrap-break-words font-medium">{equipmentName || "未設定"}</dd>
            </div>
          </dl>
          <GameCount label="取得ゲーム数" value={setCount.me} />
        </section>

        <section className={`order-2 border-b-2 border-slate-900 lg:border-b-0 lg:border-r-2 ${compact ? "p-4" : "p-5 sm:p-6"}`}>
          <p className="mb-4 text-center text-xs font-bold tracking-[0.2em] text-slate-500">セット別スコア</p>
          <ScoreRows compact={compact} scores={scores} />
          <p className="mt-4 text-center text-xs font-semibold text-slate-500">セットカウント</p>
          <p className={`${compact ? "text-2xl" : "text-3xl"} mt-1 text-center font-black tabular-nums`}>
            {setCount.me} - {setCount.opp}
          </p>
        </section>

        <section className={`order-3 flex min-h-52 flex-col ${sectionPadding}`}>
          <p className="text-xs font-bold tracking-[0.2em] text-slate-500">相手</p>
          <h2 className={`mt-4 wrap-break-words font-black tracking-wide ${nameStyle}`}>{opponentName}</h2>
          <dl className="mt-5 border-t border-dashed border-slate-400 pt-3 text-sm">
            <div className="grid grid-cols-[4rem_1fr] gap-2">
              <dt className="font-semibold text-slate-500">所属</dt>
              <dd className="wrap-break-words font-medium">{opponentTeam || "未設定"}</dd>
            </div>
          </dl>
          <GameCount label="取得ゲーム数" value={setCount.opp} />
        </section>
      </div>

      {memo ? (
        <footer className={`border-t-2 border-slate-900 bg-white/60 ${compact ? "px-4 py-3" : "px-5 py-4"}`}>
          <p className="text-xs font-bold tracking-wider text-slate-500">メモ</p>
          <p className={`${compact ? "line-clamp-2" : ""} mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700`}>
            {memo}
          </p>
        </footer>
      ) : null}

      {compact ? (
        <div className="border-t-2 border-slate-900 bg-slate-950 px-4 py-3 text-right text-sm font-bold text-white">
          詳細・編集を見る →
        </div>
      ) : null}
    </article>
  );
}
