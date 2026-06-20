"use client";

import { FormEvent, useState } from "react";
import { Button, ErrorMessage, Field, inputClass } from "@/components/ui";
import type { ApiResponse, EquipmentView } from "@/types/app";

type EquipmentFormState = {
  blade: string;
  rubberFh: string;
  rubberFhThickness: string;
  rubberBh: string;
  rubberBhThickness: string;
  gripType: string;
  isCurrent: boolean;
};

const emptyForm: EquipmentFormState = {
  blade: "",
  rubberFh: "",
  rubberFhThickness: "",
  rubberBh: "",
  rubberBhThickness: "",
  gripType: "",
  isCurrent: true
};

export function EquipmentManager({ initialEquipment }: { initialEquipment: EquipmentView[] }) {
  const [items, setItems] = useState(initialEquipment);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EquipmentFormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function startEdit(item: EquipmentView) {
    setEditingId(item.id);
    setForm({
      blade: item.blade,
      rubberFh: item.rubberFh ?? "",
      rubberFhThickness: item.rubberFhThickness ?? "",
      rubberBh: item.rubberBh ?? "",
      rubberBhThickness: item.rubberBhThickness ?? "",
      gripType: item.gripType ?? "",
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

    try {
      const response = await fetch(editingId ? `/api/equipment/${editingId}` : "/api/equipment", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const payload = (await response.json()) as ApiResponse<EquipmentView>;

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
    } catch {
      setError("通信に失敗しました。時間をおいて再試行してください。");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("この用具を削除しますか？")) {
      return;
    }

    setError(null);
    setDeletingId(id);

    try {
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
    } catch {
      setError("通信に失敗しました。時間をおいて再試行してください。");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(320px,400px)_1fr]">
      <form className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.04] sm:p-6" onSubmit={handleSubmit}>
        <h2 className="text-lg font-bold text-slate-950">{editingId ? "用具を編集" : "用具を追加"}</h2>
        <p className="mt-1 text-sm text-slate-500">現在使用しているラケット構成を登録できます。</p>
        <div className="mt-4 space-y-4">
          <ErrorMessage message={error} />
          <Field label="ラケット名">
            <input
              className={inputClass}
              maxLength={120}
              onChange={(event) => setForm((current) => ({ ...current, blade: event.target.value }))}
              required
              placeholder="例：インナーフォース レイヤー ALC"
              value={form.blade}
            />
          </Field>
          <Field label="グリップ形状">
            <input
              className={inputClass}
              list="grip-shapes"
              maxLength={80}
              onChange={(event) => setForm((current) => ({ ...current, gripType: event.target.value }))}
              placeholder="フレア、ストレートなど"
              value={form.gripType}
            />
            <datalist id="grip-shapes">
              <option value="フレア" />
              <option value="ストレート" />
              <option value="アナトミック" />
              <option value="中国式ペン" />
              <option value="日本式ペン" />
            </datalist>
          </Field>
          <Field label="フォアラバー">
            <input
              className={inputClass}
              maxLength={120}
              onChange={(event) => setForm((current) => ({ ...current, rubberFh: event.target.value }))}
              value={form.rubberFh}
            />
          </Field>
          <Field label="フォアラバーの厚さ">
            <input
              className={inputClass}
              maxLength={40}
              onChange={(event) => setForm((current) => ({ ...current, rubberFhThickness: event.target.value }))}
              placeholder="MAX、特厚、2.1mmなど"
              value={form.rubberFhThickness}
            />
          </Field>
          <Field label="バックラバー">
            <input
              className={inputClass}
              maxLength={120}
              onChange={(event) => setForm((current) => ({ ...current, rubberBh: event.target.value }))}
              value={form.rubberBh}
            />
          </Field>
          <Field label="バックラバーの厚さ">
            <input
              className={inputClass}
              maxLength={40}
              onChange={(event) => setForm((current) => ({ ...current, rubberBhThickness: event.target.value }))}
              placeholder="MAX、特厚、2.1mmなど"
              value={form.rubberBhThickness}
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
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "保存中..." : editingId ? "更新" : "追加"}
            </Button>
            {editingId ? (
              <Button
                disabled={isSubmitting}
                onClick={resetForm}
                type="button"
                variant="secondary"
              >
                キャンセル
              </Button>
            ) : null}
          </div>
        </div>
      </form>
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-10 text-center text-sm leading-6 text-slate-600">
            用具はまだ登録されていません。<br />左のフォームから最初の用具を追加できます。
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.04] transition hover:border-emerald-200 hover:shadow-md">
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
                  <p className="mt-2 text-sm text-slate-600">グリップ: {item.gripType || "未設定"}</p>
                  <p className="text-sm text-slate-600">
                    FH: {item.rubberFh || "未設定"}
                    {item.rubberFhThickness ? `（${item.rubberFhThickness}）` : ""}
                  </p>
                  <p className="text-sm text-slate-600">
                    BH: {item.rubberBh || "未設定"}
                    {item.rubberBhThickness ? `（${item.rubberBhThickness}）` : ""}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    className="min-h-10 px-3"
                    disabled={deletingId === item.id}
                    onClick={() => startEdit(item)}
                    type="button"
                    variant="secondary"
                  >
                    編集
                  </Button>
                  <Button
                    className="min-h-10 px-3"
                    disabled={deletingId === item.id}
                    onClick={() => handleDelete(item.id)}
                    type="button"
                    variant="danger"
                  >
                    {deletingId === item.id ? "削除中..." : "削除"}
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
