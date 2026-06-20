"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ErrorMessage, Field, buttonStyles, inputClass } from "@/components/ui";
import { toDateInputValue } from "@/lib/format";
import { formatSetCount } from "@/lib/match-record";
import type { ApiResponse, MatchRecordView, ScoreRow } from "@/types/app";

const defaultScores: ScoreRow[] = [
  { set: 1, me: 11, opp: 0 },
  { set: 2, me: 11, opp: 0 },
  { set: 3, me: 11, opp: 0 }
];

export function MatchForm({ match }: { match?: MatchRecordView }) {
  const router = useRouter();
  const [scores, setScores] = useState<ScoreRow[]>(match?.scores.length ? match.scores : defaultScores);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  function updateScore(index: number, key: keyof ScoreRow, value: number) {
    setScores((current) =>
      current.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row))
    );
  }

  function addScoreRow() {
    setScores((current) => {
      if (current.length >= 7) {
        return current;
      }

      return [...current, { set: current.length + 1, me: 0, opp: 0 }];
    });
  }

  function removeScoreRow(index: number) {
    setScores((current) =>
      current
        .filter((_, rowIndex) => rowIndex !== index)
        .map((row, rowIndex) => ({ ...row, set: rowIndex + 1 }))
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      const response = await fetch(match ? `/api/match/${match.id}` : "/api/match", {
        method: match ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playedAt: String(formData.get("playedAt") ?? ""),
          opponentName: String(formData.get("opponentName") ?? ""),
          opponentTeam: String(formData.get("opponentTeam") ?? ""),
          matchType: String(formData.get("matchType") ?? "PRACTICE"),
          scores,
          result: String(formData.get("result") ?? "WIN"),
          memo: String(formData.get("memo") ?? "")
        })
      });
      const payload = (await response.json()) as ApiResponse<MatchRecordView>;

      if (!response.ok || !payload.data) {
        setError(payload.error ?? "試合記録の保存に失敗しました");
        return;
      }

      router.push("/match");
      router.refresh();
    } catch {
      setError("通信に失敗しました。時間をおいて再試行してください。");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!match || !window.confirm("この試合記録を削除しますか？")) {
      return;
    }

    setError(null);
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/match/${match.id}`, { method: "DELETE" });
      const payload = (await response.json()) as ApiResponse<{ id: string }>;

      if (!response.ok) {
        setError(payload.error ?? "試合記録の削除に失敗しました");
        return;
      }

      router.push("/match");
      router.refresh();
    } catch {
      setError("通信に失敗しました。時間をおいて再試行してください。");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <ErrorMessage message={error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field hint="試合を行った日を選択してください。" label="試合日">
          <input
            className={inputClass}
            defaultValue={match ? toDateInputValue(match.playedAt) : toDateInputValue(new Date())}
            name="playedAt"
            required
            type="date"
          />
        </Field>
        <Field label="対戦相手名">
          <input className={inputClass} defaultValue={match?.opponentName ?? ""} maxLength={120} name="opponentName" placeholder="例：佐藤" required />
        </Field>
        <Field label="相手所属チーム">
          <input className={inputClass} defaultValue={match?.opponentTeam ?? ""} maxLength={120} name="opponentTeam" placeholder="例：〇〇高校" />
        </Field>
        <Field label="試合種別">
          <select
            className={inputClass}
            defaultValue={match?.matchType === "PRACTICE" ? "PRACTICE" : "OFFICIAL"}
            name="matchType"
          >
            <option value="PRACTICE">練習試合</option>
            <option value="OFFICIAL">公式試合</option>
          </select>
        </Field>
        <Field label="勝敗">
          <select className={inputClass} defaultValue={match?.result === "LOSE" ? "LOSE" : "WIN"} name="result">
            <option value="WIN">勝利</option>
            <option value="LOSE">敗北</option>
          </select>
        </Field>
      </div>
      <div>
        <div className="overflow-hidden rounded-2xl border border-slate-300 bg-[#fffdf7] shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 px-4 py-4 text-white sm:px-5">
            <div>
              <p className="text-xs font-semibold tracking-wider text-slate-300">セットカウント</p>
              <strong className="mt-1 block text-3xl font-black tabular-nums">{formatSetCount(scores)}</strong>
            </div>
            <button
              className="min-h-11 rounded-xl border border-white bg-white px-4 text-sm font-bold text-slate-950 transition hover:bg-slate-100 focus-visible:ring-4 focus-visible:ring-white/30 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={scores.length >= 7}
              onClick={addScoreRow}
              type="button"
            >
              {scores.length >= 7 ? "7セットまで" : "+ セット追加"}
            </button>
          </div>
          <div className="p-3 sm:p-5">
            <p className="mb-3 text-sm font-bold tracking-wide text-slate-800">セット別スコア</p>
            <div className="mb-2 grid grid-cols-[2rem_minmax(0,1fr)_1.25rem_minmax(0,1fr)_3.5rem] items-center gap-2 text-center text-xs font-bold text-slate-600 sm:grid-cols-[3rem_8rem_1.5rem_8rem_4rem]">
              <span>SET</span>
              <span>自分</span>
              <span />
              <span>相手</span>
              <span>操作</span>
            </div>
            <div className="space-y-2">
              {scores.map((row, index) => (
                <div
                  className="grid grid-cols-[2rem_minmax(0,1fr)_1.25rem_minmax(0,1fr)_3.5rem] items-center gap-2 border-t border-slate-300 pt-2 sm:grid-cols-[3rem_8rem_1.5rem_8rem_4rem]"
                  key={index}
                >
                  <span className="text-center text-sm font-bold tabular-nums text-slate-600">{row.set}</span>
                  <input
                    aria-label={`第${index + 1}セット 自分の得点`}
                    className={`${inputClass} border-slate-400 px-1 text-center text-xl font-black tabular-nums`}
                    min={0}
                    max={99}
                    onChange={(event) => updateScore(index, "me", Number(event.target.value))}
                    type="number"
                    value={row.me}
                  />
                  <span className="text-center text-xl font-black text-slate-500">-</span>
                  <input
                    aria-label={`第${index + 1}セット 相手の得点`}
                    className={`${inputClass} border-slate-400 px-1 text-center text-xl font-black tabular-nums`}
                    min={0}
                    max={99}
                    onChange={(event) => updateScore(index, "opp", Number(event.target.value))}
                    type="number"
                    value={row.opp}
                  />
                  <button
                    aria-label={`第${index + 1}セットを削除`}
                    className="min-h-10 rounded-lg border border-red-200 bg-white px-1 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={scores.length <= 1}
                    onClick={() => removeScoreRow(index)}
                    type="button"
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Field hint="良かった点や次回改善したいプレーを残せます。" label="反省・メモ">
        <textarea className={`${inputClass} min-h-44 resize-y`} defaultValue={match?.memo ?? ""} maxLength={4000} name="memo" placeholder="例：相手のバック側への展開が有効だった" rows={7} />
      </Field>
      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center">
        <Button
          className="sm:min-w-28"
          disabled={isSubmitting || isDeleting}
          type="submit"
        >
          {isSubmitting ? "保存中..." : "保存"}
        </Button>
        <Link className={buttonStyles({ variant: "secondary" })} href="/match">
          一覧へ戻る
        </Link>
        {match ? (
          <Button
            className="sm:ml-auto"
            disabled={isSubmitting || isDeleting}
            onClick={handleDelete}
            type="button"
            variant="danger"
          >
            {isDeleting ? "削除中..." : "削除"}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
