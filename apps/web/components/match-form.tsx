"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ErrorMessage, Field, inputClass } from "@/components/ui";
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

      router.push(match ? `/match/${payload.data.id}` : "/match");
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
    <form className="space-y-4" onSubmit={handleSubmit}>
      <ErrorMessage message={error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="試合日">
          <input
            className={inputClass}
            defaultValue={match ? toDateInputValue(match.playedAt) : toDateInputValue(new Date())}
            name="playedAt"
            required
            type="date"
          />
        </Field>
        <Field label="対戦相手名">
          <input className={inputClass} defaultValue={match?.opponentName ?? ""} maxLength={120} name="opponentName" required />
        </Field>
        <Field label="相手所属チーム">
          <input className={inputClass} defaultValue={match?.opponentTeam ?? ""} maxLength={120} name="opponentTeam" />
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
          <select className={inputClass} defaultValue={match?.result === "WIN" ? "WIN" : "LOSE"} name="result">
            <option value="WIN">勝利</option>
            <option value="LOSE">敗北</option>
          </select>
        </Field>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">セット別スコア</span>
          <button
            className="min-h-9 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            disabled={scores.length >= 7}
            onClick={addScoreRow}
            type="button"
          >
            {scores.length >= 7 ? "7セットまで" : "セット追加"}
          </button>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 sm:p-4">
          <div className="mb-2 grid grid-cols-[2rem_minmax(0,1fr)_1.25rem_minmax(0,1fr)_2.5rem] items-center gap-2 text-center text-xs font-semibold text-slate-600 sm:grid-cols-[2.5rem_7rem_1.5rem_7rem_auto]">
            <span>SET</span>
            <span>自分</span>
            <span />
            <span>相手</span>
            <span />
          </div>
          <div className="space-y-2">
            {scores.map((row, index) => (
              <div
                className="grid grid-cols-[2rem_minmax(0,1fr)_1.25rem_minmax(0,1fr)_2.5rem] items-center gap-2 sm:grid-cols-[2.5rem_7rem_1.5rem_7rem_auto]"
                key={index}
              >
                <span className="text-center text-sm font-semibold tabular-nums text-slate-500">{index + 1}</span>
                <input
                  aria-label={`第${index + 1}セット 自分の得点`}
                  className={`${inputClass} px-2 text-center text-lg font-bold tabular-nums`}
                  min={0}
                  max={99}
                  onChange={(event) => updateScore(index, "me", Number(event.target.value))}
                  type="number"
                  value={row.me}
                />
                <span className="text-center text-lg font-bold text-slate-400">-</span>
                <input
                  aria-label={`第${index + 1}セット 相手の得点`}
                  className={`${inputClass} px-2 text-center text-lg font-bold tabular-nums`}
                  min={0}
                  max={99}
                  onChange={(event) => updateScore(index, "opp", Number(event.target.value))}
                  type="number"
                  value={row.opp}
                />
                <button
                  aria-label={`第${index + 1}セットを削除`}
                  className="grid size-10 place-items-center rounded-md border border-red-200 bg-white text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-40"
                  disabled={scores.length <= 1}
                  onClick={() => removeScoreRow(index)}
                  type="button"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-baseline justify-end gap-3 border-t border-slate-200 pt-3">
            <span className="text-sm font-medium text-slate-600">合計</span>
            <strong className="text-2xl font-bold tabular-nums text-slate-950">{formatSetCount(scores)}</strong>
          </div>
        </div>
      </div>
      <Field label="反省・メモ">
        <textarea className={inputClass} defaultValue={match?.memo ?? ""} maxLength={4000} name="memo" rows={7} />
      </Field>
      <div className="flex flex-wrap gap-2">
        <button
          className="min-h-10 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          disabled={isSubmitting || isDeleting}
          type="submit"
        >
          {isSubmitting ? "保存中..." : "保存"}
        </button>
        {match ? (
          <button
            className="min-h-10 rounded-md border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50"
            disabled={isSubmitting || isDeleting}
            onClick={handleDelete}
            type="button"
          >
            {isDeleting ? "削除中..." : "削除"}
          </button>
        ) : null}
      </div>
    </form>
  );
}
