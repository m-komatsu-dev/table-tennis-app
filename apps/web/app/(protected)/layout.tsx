import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@table-tennis/db";
import { auth, signOut } from "@/auth";
import { ProtectedNav } from "@/components/protected-nav";

export default async function ProtectedLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const headerUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, avatarUrl: true }
  });
  const userName = headerUser?.name ?? session.user.name ?? "ユーザー";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:flex-nowrap lg:px-8">
          <Link className="inline-flex shrink-0 items-center gap-2.5 rounded-xl" href="/dashboard">
            <span className="grid size-9 place-items-center rounded-xl bg-emerald-600 text-sm font-black text-white shadow-sm shadow-emerald-900/20">T</span>
            <span>
              <span className="block text-base font-bold tracking-tight text-slate-950">Table Tennis Log</span>
              <span className="hidden text-[10px] font-semibold tracking-widest text-emerald-700 sm:block">PLAYER DASHBOARD</span>
            </span>
          </Link>

          <div className="order-3 w-full lg:order-none lg:w-auto lg:flex-1">
            <ProtectedNav />
          </div>

          <div className="flex shrink-0 items-center gap-2 overflow-visible">
            <Link
              aria-label="プロフィールを開く"
              className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-emerald-100 bg-emerald-50 text-sm font-bold text-emerald-700 shadow-sm"
              href="/profile"
            >
              {headerUser?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="" className="h-full w-full object-cover" src={headerUser.avatarUrl} />
              ) : (
                userName.slice(0, 1)
              )}
            </Link>
            <span className="hidden max-w-32 truncate whitespace-nowrap text-sm font-medium leading-normal text-slate-600 xl:block">
              {userName}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:ring-4 focus-visible:ring-emerald-500/10">
                ログアウト
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">{children}</main>
    </div>
  );
}
