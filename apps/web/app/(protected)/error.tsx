"use client";

import { Card } from "@/components/ui";

export default function ProtectedError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Card>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold text-slate-950">画面の読み込みに失敗しました</h1>
          <p className="mt-2 text-sm text-slate-600">
            時間をおいて再試行してください。問題が続く場合は環境変数とDB接続を確認してください。
          </p>
          {error.digest ? <p className="mt-2 text-xs text-slate-500">Error ID: {error.digest}</p> : null}
        </div>
        <button
          className="min-h-10 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
          onClick={reset}
          type="button"
        >
          再読み込み
        </button>
      </div>
    </Card>
  );
}
