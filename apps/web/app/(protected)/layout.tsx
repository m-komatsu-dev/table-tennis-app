import Link from "next/link";
import { redirect } from "next/navigation";
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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/dashboard" className="text-lg font-bold text-slate-950">
            Table Tennis Log
          </Link>
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            <ProtectedNav />
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button className="rounded-md border border-slate-300 px-3 py-2 font-medium text-slate-700 transition hover:bg-slate-100">
                ログアウト
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
