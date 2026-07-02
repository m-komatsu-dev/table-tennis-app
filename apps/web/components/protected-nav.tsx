"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "ホーム" },
  { href: "/practice", label: "練習" },
  { href: "/match", label: "試合" },
  { href: "/partner-posts", label: "募集" },
  { href: "/calendar", label: "カレンダー" },
  { href: "/analytics", label: "分析" },
  { href: "/practice-menus", label: "練習メニュー" },
  { href: "/ai-coach", label: "AIコーチ" },
  { href: "/profile", label: "プロフィール" }
];

const adminNavItems = [
  { href: "/admin/reports", label: "通報管理" }
];

export function ProtectedNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const visibleNavItems = isAdmin ? [...navItems, ...adminNavItems] : navItems;

  return (
    <nav aria-label="メインナビゲーション" className="flex flex-wrap items-center gap-1 lg:justify-center">
      {visibleNavItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={`relative inline-flex min-h-10 items-center rounded-xl px-3 text-sm font-semibold transition focus-visible:ring-4 focus-visible:ring-emerald-500/10 ${
              isActive
                ? "bg-emerald-50 text-emerald-800 shadow-sm shadow-emerald-900/[0.04]"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            }`}
            href={item.href}
            key={item.href}
          >
            {item.label}
            {isActive ? <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-emerald-500" /> : null}
          </Link>
        );
      })}
    </nav>
  );
}
