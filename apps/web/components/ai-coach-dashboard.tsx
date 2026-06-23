"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, ErrorMessage } from "@/components/ui";
import { practiceMenuCategoryLabels } from "@/lib/practice-menu";
import type { AiCoachMeta } from "@/lib/ai/context";
import type { AiAnalysisResult, AiPracticeMenuSuggestion } from "@/lib/ai/schemas";

type ApiResponse<T> = {
  data?: T;
  error?: string;
};

async function postJson<T>(url: string, body?: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const payload = (await response.json().catch(() => ({}))) as ApiResponse<T>;

  if (!response.ok || !payload.data) {
    throw new Error(payload.error ?? "処理に失敗しました。時間をおいて再試行してください。");
  }

  return payload.data;
}

function ResultList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, index) => (
        <li className="flex gap-3 text-sm leading-6 text-slate-700" key={`${index}-${item}`}>
          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function AiCoachDashboard({ initialDataSparse }: { initialDataSparse: boolean }) {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<AiAnalysisResult | null>(null);
  const [suggestion, setSuggestion] = useState<AiPracticeMenuSuggestion | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dataSparse, setDataSparse] = useState(initialDataSparse);

  async function analyze() {
    if (isAnalyzing) return;
    setAnalysisError(null);
    setIsAnalyzing(true);

    try {
      const data = await postJson<{ result: AiAnalysisResult; meta: AiCoachMeta }>("/api/ai/analyze");
      setAnalysis(data.result);
      setDataSparse(data.meta.isDataSparse);
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : "AI課題分析に失敗しました。");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function suggestMenu() {
    if (isSuggesting) return;
    setSuggestionError(null);
    setIsSuggesting(true);

    try {
      const data = await postJson<{ result: AiPracticeMenuSuggestion; meta: AiCoachMeta }>("/api/ai/practice-menu");
      setSuggestion(data.result);
      setDataSparse(data.meta.isDataSparse);
    } catch (error) {
      setSuggestionError(error instanceof Error ? error.message : "練習メニューの提案に失敗しました。");
    } finally {
      setIsSuggesting(false);
    }
  }

  async function saveMenu() {
    if (!suggestion || isSaving) return;
    setSuggestionError(null);
    setIsSaving(true);

    try {
      const data = await postJson<{ id: string }>("/api/ai/practice-menu/save", suggestion);
      router.push(`/practice-menus/${data.id}`);
      router.refresh();
    } catch (error) {
      setSuggestionError(error instanceof Error ? error.message : "練習メニューの保存に失敗しました。");
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {dataSparse ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-950">
          <strong className="block">記録を増やすと分析精度が上がります。</strong>
          現在の記録から分かる範囲で提案します。試合メモや練習内容も残すと、より具体的になります。
        </div>
      ) : null}

      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-50 via-white to-cyan-50 p-5 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Badge tone="emerald">DATA ANALYSIS</Badge>
              <h2 className="mt-3 text-xl font-bold text-slate-950">AI課題分析</h2>
              <p className="mt-1.5 text-sm leading-6 text-slate-600">直近の記録と勝率傾向から、強みと次の課題を整理します。</p>
            </div>
            <Button className="shrink-0 sm:min-w-48" disabled={isAnalyzing} onClick={analyze} type="button">
              {isAnalyzing ? "分析中..." : analysis ? "もう一度分析する" : "AIで課題分析する"}
            </Button>
          </div>
        </div>
        <div className="p-5 sm:p-7">
          <ErrorMessage message={analysisError} />
          {isAnalyzing ? (
            <div className="grid min-h-44 place-items-center" role="status">
              <div className="text-center">
                <span className="mx-auto block size-8 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
                <p className="mt-3 text-sm font-medium text-slate-600">記録を読み解いています...</p>
              </div>
            </div>
          ) : analysis ? (
            <div className="space-y-6">
              <section className="rounded-2xl bg-slate-950 p-5 text-white sm:p-6">
                <p className="text-xs font-bold tracking-widest text-emerald-300">総評</p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-100">{analysis.summary}</p>
              </section>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  ["強み", analysis.strengths],
                  ["課題", analysis.weaknesses],
                  ["負け試合の傾向", analysis.losingPatterns],
                  ["重点的に練習すること", analysis.recommendedFocus],
                  ["次の行動", analysis.nextActions]
                ].map(([title, items]) => (
                  <section className="rounded-2xl border border-slate-200 p-5 last:md:col-span-2" key={title as string}>
                    <h3 className="mb-3 font-bold text-slate-950">{title as string}</h3>
                    <ResultList items={items as string[]} />
                  </section>
                ))}
              </div>
            </div>
          ) : (
            <p className="py-10 text-center text-sm leading-6 text-slate-500">ボタンを押すと、保存済みの記録だけを使って分析します。</p>
          )}
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-emerald-50 p-5 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Badge tone="blue">PRACTICE PLAN</Badge>
              <h2 className="mt-3 text-xl font-bold text-slate-950">AI練習メニュー提案</h2>
              <p className="mt-1.5 text-sm leading-6 text-slate-600">課題に優先順位を付け、次回用の具体的なメニューを組み立てます。</p>
            </div>
            <Button className="shrink-0 sm:min-w-52" disabled={isSuggesting || isSaving} onClick={suggestMenu} type="button">
              {isSuggesting ? "提案を作成中..." : suggestion ? "別のメニューを提案" : "AIで練習メニューを提案"}
            </Button>
          </div>
        </div>
        <div className="p-5 sm:p-7">
          <ErrorMessage message={suggestionError} />
          {isSuggesting ? (
            <div className="grid min-h-44 place-items-center" role="status">
              <div className="text-center">
                <span className="mx-auto block size-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
                <p className="mt-3 text-sm font-medium text-slate-600">次回の練習を組み立てています...</p>
              </div>
            </div>
          ) : suggestion ? (
            <div>
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-bold text-slate-950">{suggestion.title}</h3>
                    <Badge tone="emerald">合計 {suggestion.totalMinutes}分</Badge>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-800">目的</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">{suggestion.goal}</p>
                  {suggestion.description ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{suggestion.description}</p> : null}
                </div>
                <Button className="shrink-0" disabled={isSaving} onClick={saveMenu} type="button">
                  {isSaving ? "保存中..." : "練習メニューとして保存"}
                </Button>
              </div>
              <ol className="mt-6 space-y-3">
                {[...suggestion.items].sort((a, b) => a.order - b.order).map((item, index) => (
                  <li className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5" key={`${item.order}-${item.title}`}>
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-blue-600 text-sm font-black text-white">{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-slate-950">{item.title}</h4>
                        <Badge tone="blue">{practiceMenuCategoryLabels[item.category]}</Badge>
                        <Badge>{item.durationMin}分</Badge>
                      </div>
                      {item.description ? <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{item.description}</p> : null}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <p className="py-10 text-center text-sm leading-6 text-slate-500">提案後に内容を確認し、既存の練習メニューとして保存できます。</p>
          )}
        </div>
      </Card>

      <aside className="rounded-2xl border border-slate-200 bg-white/70 px-5 py-4 text-xs leading-6 text-slate-600">
        AIの提案は参考情報です。実際の練習内容は自分の体調や環境に合わせて調整してください。
      </aside>
    </div>
  );
}
