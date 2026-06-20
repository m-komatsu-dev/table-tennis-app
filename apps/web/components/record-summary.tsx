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
      ? "border-blue-100 bg-gradient-to-br from-white via-white to-blue-50"
      : "border-emerald-100 bg-gradient-to-br from-white via-white to-emerald-50";
  const accent = tone === "blue" ? "bg-blue-500" : "bg-emerald-500";

  return (
    <section className={`relative overflow-hidden rounded-3xl border p-5 shadow-sm shadow-slate-900/[0.04] sm:p-6 ${styles}`}>
      <div className={`absolute -right-10 -top-10 size-32 rounded-full opacity-[0.08] ${accent}`} />
      <div className="relative flex items-center gap-2.5">
        <span className={`size-2.5 rounded-full ${accent}`} />
        <h2 className="text-base font-bold tracking-tight text-slate-950">{title}</h2>
      </div>
      <dl className={`relative mt-5 grid gap-3 ${items.length > 2 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2"}`}>
        {items.map((item) => (
          <div className="min-w-0 rounded-2xl border border-white/80 bg-white/70 p-3 backdrop-blur-sm" key={item.label}>
            <dt className="text-xs font-medium text-slate-600 sm:text-sm">{item.label}</dt>
            <dd className="mt-1.5 break-words text-2xl font-black tracking-tight tabular-nums text-slate-950 sm:text-3xl">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
