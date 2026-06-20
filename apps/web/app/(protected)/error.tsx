"use client";

import { Button, Card } from "@/components/ui";

export default function ProtectedError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Card className="mx-auto max-w-2xl border-red-100 p-6 sm:p-8">
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-slate-950">画面の読み込みに失敗しました</h1>
          <p className="mt-2 text-sm text-slate-600">
            時間をおいて再試行してください。問題が続く場合は環境変数とDB接続を確認してください。
          </p>
          {error.digest ? <p className="mt-2 text-xs text-slate-500">Error ID: {error.digest}</p> : null}
        </div>
        <Button onClick={reset} type="button">
          再読み込み
        </Button>
      </div>
    </Card>
  );
}
