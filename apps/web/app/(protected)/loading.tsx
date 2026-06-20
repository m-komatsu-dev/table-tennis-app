import { Card } from "@/components/ui";

export default function ProtectedLoading() {
  return (
    <div className="space-y-7" role="status" aria-label="読み込み中">
      <span className="sr-only">読み込み中です</span>
      <div className="space-y-2">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-4 w-full max-w-md animate-pulse rounded-lg bg-slate-200" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card className="overflow-hidden" key={index}>
            <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
            <div className="mt-3 h-8 w-20 animate-pulse rounded bg-slate-200" />
          </Card>
        ))}
      </div>
      <Card>
        <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
      </Card>
    </div>
  );
}
