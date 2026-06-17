"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ErrorMessage, Field, inputClass } from "@/components/ui";
import { toDateInputValue } from "@/lib/format";
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

  function updateScore(index: number, key: keyof ScoreRow, value: number) {
    setScores((current) =>
      current.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row))
    );
  }

  function addScoreRow() {
    setScores((current) => [...current, { set: current.length + 1, me: 0, opp: 0 }]);
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

    const formData = new FormData(event.currentTarget);
    const response = await fetch(match ? `/api/match/${match.id}` : "/api/match", {
      method: match ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playedAt: String(formData.get("playedAt") ?? ""),
        opponentName: String(formData.get("opponentName") ?? ""),
        matchType: String(formData.get("matchType") ?? "PRACTICE"),
        scores,
        result: String(formData.get("result") ?? "WIN"),
        memo: String(formData.get("memo") ?? "")
      })
    });
    const payload = (await response.json()) as ApiResponse<MatchRecordView>;
    setIsSubmitting(false);

    if (!response.ok || !payload.data) {
      setError(payload.error ?? "試合記録の保存に失敗しました");
      return;
    }

    router.push(`/match/${payload.data.id}`);
    router.refresh();
  }

  async function handleDelete() {
    if (!match || !window.confirm("この試合記録を削除しますか？")) {
      return;
    }

    const response = await fetch(`/api/match/${match.id}`, { method: "DELETE" });
    const payload = (await response.json()) as ApiResponse<{ id: string }>;

    if (!response.ok) {
      setError(payload.error ?? "試合記録の削除に失敗しました");
      return;
    }

    router.push("/match");
    router.refresh();
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
          <input className={inputClass} defaultValue={match?.opponentName ?? ""} name="opponentName" required />
        </Field>
        <Field label="試合種別">
          <select className={inputClass} defaultValue={match?.matchType ?? "PRACTICE"} name="matchType">
            <option value="PRACTICE">PRACTICE</option>
            <option value="OFFICIAL">OFFICIAL</option>
            <option value="TOURNAMENT">TOURNAMENT</option>
          </select>
        </Field>
        <Field label="勝敗">
          <select className={inputClass} defaultValue={match?.result ?? "WIN"} name="result">
            <option value="WIN">WIN</option>
            <option value="LOSE">LOSE</option>
            <option value="DRAW">DRAW</option>
          </select>
        </Field>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">セット別スコア</span>
          <button
            className="min-h-9 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            onClick={addScoreRow}
            type="button"
          >
            セット追加
          </button>
        </div>
        <div className="space-y-2">
          {scores.map((row, index) => (
            <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2" key={row.set}>
              <input
                aria-label="セット"
                className={inputClass}
                min={1}
                onChange={(event) => updateScore(index, "set", Number(event.target.value))}
                type="number"
                value={row.set}
              />
              <input
                aria-label="自分の得点"
                className={inputClass}
                min={0}
                onChange={(event) => updateScore(index, "me", Number(event.target.value))}
                type="number"
                value={row.me}
              />
              <input
                aria-label="相手の得点"
                className={inputClass}
                min={0}
                onChange={(event) => updateScore(index, "opp", Number(event.target.value))}
                type="number"
                value={row.opp}
              />
              <button
                className="min-h-10 rounded-md border border-red-200 px-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-40"
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
      <Field label="反省・メモ">
        <textarea className={inputClass} defaultValue={match?.memo ?? ""} name="memo" rows={7} />
      </Field>
      <div className="flex flex-wrap gap-2">
        <button
          className="min-h-10 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "保存中..." : "保存"}
        </button>
        {match ? (
          <button
            className="min-h-10 rounded-md border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50"
            onClick={handleDelete}
            type="button"
          >
            削除
          </button>
        ) : null}
      </div>
    </form>
  );
}
