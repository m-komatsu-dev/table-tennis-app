"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ErrorMessage, Field, buttonStyles, inputClass } from "@/components/ui";
import { practiceMenuCategoryOptions } from "@/lib/practice-menu";
import type { ApiResponse, PracticeMenuCategory, PracticeMenuView } from "@/types/app";

type FormItem = {
  key: string;
  title: string;
  description: string;
  category: PracticeMenuCategory;
  durationMin: string;
  order: string;
};

function emptyItem(order: number): FormItem {
  return {
    key: crypto.randomUUID(),
    title: "",
    description: "",
    category: "OTHER",
    durationMin: "",
    order: String(order)
  };
}

export function PracticeMenuForm({ menu }: { menu?: PracticeMenuView }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [items, setItems] = useState<FormItem[]>(() =>
    menu?.items.map((item) => ({
      key: item.id,
      title: item.title,
      description: item.description ?? "",
      category: item.category,
      durationMin: item.durationMin?.toString() ?? "",
      order: item.order.toString()
    })) ?? [emptyItem(0)]
  );

  function updateItem(key: string, values: Partial<FormItem>) {
    setItems((current) => current.map((item) => item.key === key ? { ...item, ...values } : item));
  }

  function removeItem(key: string) {
    setItems((current) => current.filter((item) => item.key !== key));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (items.length === 0) {
      setError("メニュー項目を1件以上追加してください");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      const totalMinutes = String(formData.get("totalMinutes") ?? "");
      const response = await fetch(menu ? `/api/practice-menus/${menu.id}` : "/api/practice-menus", {
        method: menu ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: String(formData.get("title") ?? ""),
          description: String(formData.get("description") ?? ""),
          goal: String(formData.get("goal") ?? ""),
          totalMinutes: totalMinutes === "" ? null : Number(totalMinutes),
          items: items.map((item) => ({
            title: item.title,
            description: item.description,
            category: item.category,
            durationMin: item.durationMin === "" ? null : Number(item.durationMin),
            order: Number(item.order)
          }))
        })
      });
      const payload = (await response.json()) as ApiResponse<PracticeMenuView>;

      if (!response.ok || !payload.data) {
        setError(payload.error ?? "練習メニューの保存に失敗しました");
        return;
      }

      router.push(menu ? `/practice-menus/${payload.data.id}` : "/practice-menus");
      router.refresh();
    } catch {
      setError("通信に失敗しました。時間をおいて再試行してください。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-7" onSubmit={handleSubmit}>
      <ErrorMessage message={error} />
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="メニュー名">
            <input className={inputClass} defaultValue={menu?.title ?? ""} maxLength={100} name="title" placeholder="例：レシーブ安定強化メニュー" required />
          </Field>
        </div>
        <Field hint="1〜600分。未設定でも保存できます。" label="合計時間（分）">
          <input className={inputClass} defaultValue={menu?.totalMinutes ?? ""} max={600} min={1} name="totalMinutes" placeholder="例：90" type="number" />
        </Field>
        <div className="sm:col-span-2">
          <Field label="目的">
            <textarea className={`${inputClass} min-h-24 resize-y`} defaultValue={menu?.goal ?? ""} maxLength={500} name="goal" placeholder="例：短いレシーブから先手を取る" rows={3} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="説明">
            <textarea className={`${inputClass} min-h-28 resize-y`} defaultValue={menu?.description ?? ""} maxLength={1000} name="description" placeholder="メニュー全体の進め方や注意点" rows={4} />
          </Field>
        </div>
      </div>

      <section className="border-t border-slate-200 pt-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">メニュー項目</h2>
            <p className="mt-1 text-sm text-slate-600">練習内容を1件以上登録してください。</p>
          </div>
          <Button onClick={() => setItems((current) => [...current, emptyItem(current.length)])} type="button" variant="secondary">
            ＋ 項目を追加
          </Button>
        </div>

        <div className="mt-5 space-y-4">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-5 py-8 text-center text-sm font-medium text-amber-900">
              メニュー項目がありません。「項目を追加」から追加してください。
            </div>
          ) : items.map((item, index) => (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5" key={item.key}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="font-bold text-slate-900">項目 {index + 1}</h3>
                <Button onClick={() => removeItem(item.key)} type="button" variant="danger">削除</Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="タイトル">
                  <input className={inputClass} maxLength={100} onChange={(event) => updateItem(item.key, { title: event.target.value })} required value={item.title} />
                </Field>
                <Field label="カテゴリ">
                  <select className={inputClass} onChange={(event) => updateItem(item.key, { category: event.target.value as PracticeMenuCategory })} value={item.category}>
                    {practiceMenuCategoryOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </Field>
                <Field label="時間（分）">
                  <input className={inputClass} max={300} min={1} onChange={(event) => updateItem(item.key, { durationMin: event.target.value })} placeholder="未設定可" type="number" value={item.durationMin} />
                </Field>
                <Field label="並び順">
                  <input className={inputClass} min={0} onChange={(event) => updateItem(item.key, { order: event.target.value })} required type="number" value={item.order} />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="説明">
                    <textarea className={`${inputClass} min-h-24 resize-y`} maxLength={500} onChange={(event) => updateItem(item.key, { description: event.target.value })} rows={3} value={item.description} />
                  </Field>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row">
        <Button className="sm:min-w-28" disabled={isSubmitting} type="submit">
          {isSubmitting ? "保存中..." : "保存"}
        </Button>
        <Link className={buttonStyles({ variant: "secondary" })} href={menu ? `/practice-menus/${menu.id}` : "/practice-menus"}>キャンセル</Link>
      </div>
    </form>
  );
}
