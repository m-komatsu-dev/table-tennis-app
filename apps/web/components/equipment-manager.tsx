"use client";

import { FormEvent, useState } from "react";
import { ErrorMessage, Field, inputClass } from "@/components/ui";
import type { ApiResponse, EquipmentView } from "@/types/app";

type EquipmentFormState = {
  blade: string;
  rubberFh: string;
  rubberBh: string;
  isCurrent: boolean;
};

const emptyForm: EquipmentFormState = {
  blade: "",
  rubberFh: "",
  rubberBh: "",
  isCurrent: true
};

export function EquipmentManager({ initialEquipment }: { initialEquipment: EquipmentView[] }) {
  const [items, setItems] = useState(initialEquipment);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EquipmentFormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function startEdit(item: EquipmentView) {
    setEditingId(item.id);
    setForm({
      blade: item.blade,
      rubberFh: item.rubberFh ?? "",
      rubberBh: item.rubberBh ?? "",
      isCurrent: item.isCurrent
    });
    setError(null);
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const response = await fetch(editingId ? `/api/equipment/${editingId}` : "/api/equipment", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const payload = (await response.json()) as ApiResponse<EquipmentView>;
    setIsSubmitting(false);

    if (!response.ok || !payload.data) {
      setError(payload.error ?? "用具の保存に失敗しました");
      return;
    }

    if (editingId) {
      setItems((current) => current.map((item) => (item.id === editingId ? payload.data as EquipmentView : item)));
    } else {
      setItems((current) => [payload.data as EquipmentView, ...current]);
    }
    resetForm();
  }

  async function handleDelete(id: string) {
    if (!window.confirm("この用具を削除しますか？")) {
      return;
    }

    const response = await fetch(`/api/equipment/${id}`, { method: "DELETE" });
    const payload = (await response.json()) as ApiResponse<{ id: string }>;

    if (!response.ok) {
      setError(payload.error ?? "用具の削除に失敗しました");
      return;
    }

    setItems((current) => current.filter((item) => item.id !== id));
    if (editingId === id) {
      resetForm();
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <form className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" onSubmit={handleSubmit}>
        <h2 className="text-lg font-semibold text-slate-950">{editingId ? "用具を編集" : "用具を追加"}</h2>
        <div className="mt-4 space-y-4">
          <ErrorMessage message={error} />
          <Field label="ラケット名">
            <input
              className={inputClass}
              onChange={(event) => setForm((current) => ({ ...current, blade: event.target.value }))}
              required
              value={form.blade}
            />
          </Field>
          <Field label="フォアラバー">
            <input
              className={inputClass}
              onChange={(event) => setForm((current) => ({ ...current, rubberFh: event.target.value }))}
              value={form.rubberFh}
            />
          </Field>
          <Field label="バックラバー">
            <input
              className={inputClass}
              onChange={(event) => setForm((current) => ({ ...current, rubberBh: event.target.value }))}
              value={form.rubberBh}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              checked={form.isCurrent}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600"
              onChange={(event) => setForm((current) => ({ ...current, isCurrent: event.target.checked }))}
              type="checkbox"
            />
            現在使用中
          </label>
          <div className="flex gap-2">
            <button
              className="min-h-10 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "保存中..." : editingId ? "更新" : "追加"}
            </button>
            {editingId ? (
              <button
                className="min-h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                onClick={resetForm}
                type="button"
              >
                キャンセル
              </button>
            ) : null}
          </div>
        </div>
      </form>
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
            用具はまだ登録されていません。
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-950">{item.blade}</h3>
                    {item.isCurrent ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                        使用中
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-slate-600">FH: {item.rubberFh || "未設定"}</p>
                  <p className="text-sm text-slate-600">BH: {item.rubberBh || "未設定"}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="min-h-9 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    onClick={() => startEdit(item)}
                    type="button"
                  >
                    編集
                  </button>
                  <button
                    className="min-h-9 rounded-md border border-red-200 px-3 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                    onClick={() => handleDelete(item.id)}
                    type="button"
                  >
                    削除
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
