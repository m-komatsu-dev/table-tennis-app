import type { ReactNode } from "react";

type SummaryItem = {
  label: string;
  value: ReactNode;
};

export function RecordSummary({
  title,
  items,
  tone = "emerald"
}: {
  title: string;
  items: SummaryItem[];
  tone?: "emerald" | "blue";
}) {
  const styles =
    tone === "blue"
      ? "border-blue-100 bg-gradient-to-br from-white to-blue-50/70"
      : "border-emerald-100 bg-gradient-to-br from-white to-emerald-50/70";

  return (
    <section className={`rounded-xl border p-5 shadow-sm ${styles}`}>
      <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      <dl className={`mt-4 grid gap-4 ${items.length > 2 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2"}`}>
        {items.map((item) => (
          <div className="min-w-0" key={item.label}>
            <dt className="text-xs font-medium text-slate-600 sm:text-sm">{item.label}</dt>
            <dd className="mt-1 break-words text-2xl font-bold tabular-nums text-slate-950 sm:text-3xl">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
